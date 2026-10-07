import { Router } from 'express';
import { AdminScannerController } from '../controllers/adminScanner.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  adminScannerVerifySchema,
  adminScannerMarkPresentSchema,
} from '../validators/adminScanner.validator';
import { adminScannerLimiter } from '../middlewares/rateLimiter.middleware';
import { requireAdminAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/rbac.middleware';

const router = Router();

// Protect all scanner endpoints: Require Admin Authentication & Admin Role
router.use(requireAdminAuth);
router.use(requireAdmin);

// POST /api/admin/scanner/verify - Verify student QR token from camera scanner
router.post(
  '/verify',
  adminScannerLimiter,
  validateRequest(adminScannerVerifySchema),
  AdminScannerController.verify
);

// POST /api/admin/scanner/mark-present - Explicitly mark student attendance
router.post(
  '/mark-present',
  adminScannerLimiter,
  validateRequest(adminScannerMarkPresentSchema),
  AdminScannerController.markPresent
);

export default router;
