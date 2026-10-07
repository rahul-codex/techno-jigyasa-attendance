import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { getUploadsDir, verifyImageMagicBytes } from '../utils/file.util';
import { ApiResponse } from '../utils/apiResponse.util';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadsDir());
  },
  filename: (_req, file, cb) => {
    // Generate secure randomized filename
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

// File filter checking MIME types and extensions
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error('Invalid image file format. Only JPG, JPEG, PNG, and WebP are accepted.')
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Single image upload middleware with error handling & magic byte verification.
 */
export const handleProfileImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return ApiResponse.error(
            res,
            'Image size is too large. Maximum allowed size is 2MB.',
            400
          );
        }
        return ApiResponse.error(res, `Upload error: ${err.message}`, 400);
      }
      return ApiResponse.error(res, err.message || 'Invalid profile image.', 400);
    }

    if (!req.file) {
      return ApiResponse.error(res, 'Please provide an image file to upload.', 400);
    }

    // Verify actual file content via magic bytes
    const isValidSignature = verifyImageMagicBytes(req.file.path);
    if (!isValidSignature) {
      // Delete spoofed file immediately
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore deletion error
      }
      return ApiResponse.error(
        res,
        'Invalid profile image format. The file content does not match allowed image formats.',
        400
      );
    }

    next();
  });
};
