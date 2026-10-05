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

  // Validate 6-digit Indian pincode
  const pincode = shippingAddress?.pincode ? String(shippingAddress.pincode).trim() : '';
  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    res.status(400);
    throw new Error('Pincode must be exactly 6 digits and cannot start with 0');
  }

  const verifiedItems = [];
  let totalAmount = 0;

  // Check that every product exists, has enough stock, and use database prices
  for (const item of items) {
    if (!item.quantity || item.quantity < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1');
    }

    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }

    verifiedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });

    totalAmount += product.price * item.quantity;
  }

  const order = await Order.create({
    user: req.user._id,
    items: verifiedItems,
    shippingAddress: {
      ...shippingAddress,
      pincode,
    },
    paymentMethod,
    totalAmount,
  });

  // Reduce stock after an order is successfully placed
  for (const item of verifiedItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  res.status(201).json(order);
});

// PATCH /api/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.user.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not allowed to cancel this order');
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    res.status(400);
    throw new Error('Only pending or confirmed orders can be cancelled');
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  order.status = 'cancelled';
  await order.save();

  res.json(order);
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
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.json(orders);
});

// PATCH /api/orders/:id/status (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = req.body.status;
  await order.save();

  res.json(order);
});