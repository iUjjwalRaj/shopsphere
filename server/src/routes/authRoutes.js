import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.route('/me').get(protect, getMe).put(protect, updateMe);

export default router;
