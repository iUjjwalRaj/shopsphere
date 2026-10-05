import { Router } from 'express';
import { getAdminStats } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/stats', getAdminStats);

export default router;
