import { Router } from 'express';
import {
  createOrder,
  cancelOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderSchema } from '../middleware/schemas.js';

const router = Router();

router.use(protect);

router.route('/').post(validate(orderSchema), createOrder).get(adminOnly, getAllOrders);

router.get('/mine', getMyOrders);

router.patch('/:id/cancel', cancelOrder);

router.get('/:id', getOrder);

router.patch('/:id/status', adminOnly, updateOrderStatus);

export default router;