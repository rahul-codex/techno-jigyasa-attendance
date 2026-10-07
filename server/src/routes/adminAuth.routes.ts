import { Router } from 'express';
import { AdminAuthController } from '../controllers/adminAuth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { adminLoginSchema } from '../validators/adminAuth.validator';
import { adminLoginLimiter } from '../middlewares/rateLimiter.middleware';
import { requireAdminAuth } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/admin/login - Authenticate admin & issue secure httpOnly cookie
router.post(
  '/login',
  adminLoginLimiter,
  validateRequest(adminLoginSchema),
  AdminAuthController.login
);

// POST /api/auth/admin/logout - Clear admin authentication cookie
router.post('/logout', AdminAuthController.logout);

// GET /api/auth/admin/me - Retrieve current authenticated admin profile
router.get('/me', requireAdminAuth, AdminAuthController.getMe);

export default router;
