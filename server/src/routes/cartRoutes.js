import { Router } from 'express';
import { getCart, updateCart } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.route('/').get(getCart).put(updateCart);

export default router;
