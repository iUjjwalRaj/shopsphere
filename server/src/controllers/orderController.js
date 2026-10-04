import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Order must contain at least one item');
  }

  const decrementedItems = [];

  try {
    for (const item of items) {
      if (!item.quantity || item.quantity < 1) {
        res.status(400);
        throw new Error('Quantity must be at least 1');
      }

      // Atomically decrement stock only if available stock is >= requested quantity
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!product) {
        const existing = await Product.findById(item.product);
        if (!existing) {
          res.status(404);
          throw new Error(`Product not found: ${item.product}`);
        }
        res.status(400);
        throw new Error(`Not enough stock for ${existing.name}`);
      }

      decrementedItems.push({
        product: item.product,
        quantity: item.quantity,
      });
    }

    // TODO: total is currently calculated from prices sent by the client.
    // This should use prices from the database instead (see issue tracker).
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (error) {
    // Roll back already decremented items if later item fails
    for (const item of decrementedItems) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }
    throw error;
  }
});

// GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.user._id.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to view this order');
  }
  res.json(order);
});

// GET /api/orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// PATCH /api/orders/:id/status (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const oldStatus = order.status;
  const newStatus = req.body.status;

  // Restore stock if order is cancelled
  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }
  }

  order.status = newStatus;
  await order.save();
  res.json(order);
});
