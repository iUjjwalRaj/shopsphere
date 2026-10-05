import mongoose from 'mongoose';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
  const products = wishlist ? wishlist.products.filter(Boolean) : [];
  res.json(products);
});

// POST /api/wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    res.status(400);
    throw new Error('Invalid or missing product ID');
  }

  const productExists = await Product.findById(productId);
  if (!productExists) {
    res.status(404);
    throw new Error('Product not found');
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: productId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('products');

  const products = wishlist.products.filter(Boolean);
  res.status(200).json(products);
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    res.status(400);
    throw new Error('Invalid product ID');
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: productId } },
    { new: true }
  ).populate('products');

  const products = wishlist ? wishlist.products.filter(Boolean) : [];
  res.json(products);
});
