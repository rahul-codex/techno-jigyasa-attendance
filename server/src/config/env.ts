import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_fallback_jwt_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_fallback_refresh_secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev_fallback_cookie_secret',
  QR_SECRET: process.env.QR_SECRET || 'dev_fallback_qr_secret',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads/profiles',
  MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB, 10) : 2,

  // Admin Authentication & Initial Super Admin Configuration
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev_fallback_admin_jwt_secret',
  ADMIN_JWT_EXPIRES_IN: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  INITIAL_ADMIN_ID: process.env.INITIAL_ADMIN_ID || '',
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || '',
};
