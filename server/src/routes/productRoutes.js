import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { getReviews, createReview } from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.route('/').get(getProducts).post(protect, adminOnly, createProduct);
router
  .route('/:id')
  .get(getProduct)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

router.route('/:id/reviews').get(getReviews).post(protect, createReview);

export default router;
