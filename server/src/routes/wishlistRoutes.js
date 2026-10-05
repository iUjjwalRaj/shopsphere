import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.route('/').get(getWishlist).post(addToWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
