import { Router } from 'express';
import { StudentAuthController } from '../controllers/studentAuth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  studentRegisterSchema,
  studentLoginSchema,
} from '../validators/studentAuth.validator';
import {
  studentLoginLimiter,
  studentRegisterLimiter,
} from '../middlewares/rateLimiter.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireStudent } from '../middlewares/rbac.middleware';

const router = Router();

// Student Registration
router.post(
  '/register',
  studentRegisterLimiter,
  validateRequest(studentRegisterSchema),
  StudentAuthController.register
);

// Student Login
router.post(
  '/login',
  studentLoginLimiter,
  validateRequest(studentLoginSchema),
  StudentAuthController.login
);

// Student Logout
router.post('/logout', StudentAuthController.logout);

// Current Student Session Profile
router.get('/me', requireAuth, requireStudent, StudentAuthController.getMe);

export default router;
