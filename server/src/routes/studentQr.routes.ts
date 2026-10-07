import { Router } from 'express';
import { StudentQrController } from '../controllers/studentQr.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireStudent } from '../middlewares/rbac.middleware';

const router = Router();

// All routes require authenticated student session
router.use(requireAuth, requireStudent);

// Get current active QR token and image
router.get('/qr', StudentQrController.getQr);

// Regenerate QR code (increments version and revokes old tokens)
router.post('/qr/regenerate', StudentQrController.regenerateQr);

// Get digital ID card structure
router.get('/qr/card', StudentQrController.getCard);

export default router;
