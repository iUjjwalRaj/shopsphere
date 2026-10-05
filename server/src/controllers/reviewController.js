import Review from '../models/Review.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/products/:id/reviews
export const getReviews = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const reviews = await Review.find({ product: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// POST /api/products/:id/reviews (logged-in users)
export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  // Basic validation
  if (!rating || !comment) {
    res.status(400);
    throw new Error('Rating and comment are required');
  }
  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    res.status(400);
    throw new Error('Rating must be an integer between 1 and 5');
  }
  if (!comment.trim()) {
    res.status(400);
    throw new Error('Comment cannot be empty');
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check for duplicate review (also enforced at DB level by unique index)
  const existing = await Review.findOne({ product: req.params.id, user: req.user._id });
  if (existing) {
    res.status(409);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({
    product: req.params.id,
    user: req.user._id,
    rating: parsedRating,
    comment: comment.trim(),
  });

  // Recalculate product average rating
  const stats = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' } } },
  ]);
  product.rating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  await product.save();

  const populated = await review.populate('user', 'name');
  res.status(201).json(populated);
});
