import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { productSchema, updateProductSchema } from '../middleware/schemas.js';

const router = Router();

router.route('/').get(getProducts).post(protect, adminOnly, validate(productSchema), createProduct);
router
  .route('/:id')
  .get(getProduct)
  .put(protect, adminOnly, validate(updateProductSchema), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

export default router;
