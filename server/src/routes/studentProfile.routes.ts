import { Router } from 'express';
import { StudentProfileController } from '../controllers/studentProfile.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireStudent } from '../middlewares/rbac.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { studentProfileUpdateSchema } from '../validators/studentProfile.validator';
import { handleProfileImageUpload } from '../middlewares/upload.middleware';

const router = Router();

// All routes require authenticated student role
router.use(requireAuth, requireStudent);

// Get student profile
router.get('/profile', StudentProfileController.getProfile);

// Update profile details (Name, Department, Section)
router.put(
  '/profile',
  validateRequest(studentProfileUpdateSchema),
  StudentProfileController.updateProfile
);

// Upload profile photo
router.post(
  '/profile/image',
  handleProfileImageUpload,
  StudentProfileController.uploadImage
);

// Remove profile photo
router.delete('/profile/image', StudentProfileController.removeImage);

export default router;
