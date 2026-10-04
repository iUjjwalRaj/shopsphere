import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.cart || []);
});

// PUT /api/cart
export const updateCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const user = await User.findById(req.user._id);
  user.cart = Array.isArray(items) ? items : [];
  await user.save();
  res.json(user.cart);
});
