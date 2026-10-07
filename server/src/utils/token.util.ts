import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload, AdminTokenPayload, UserRole } from '../types/auth.types';

/**
 * Sign minimal student JWT.
 * Payload contains strictly: userId, erpId, role.
 */
export const signToken = (payload: { userId: string; erpId: string; role: UserRole }): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verify student JWT using student JWT_SECRET.
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Sign minimal admin JWT.
 * Payload contains strictly: userId, adminId, role.
 * Never includes passwords, password hashes, secrets, or student details.
 */
export const signAdminToken = (payload: {
  userId: string;
  adminId: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}): string => {
  return jwt.sign(payload, env.ADMIN_JWT_SECRET, {
    expiresIn: env.ADMIN_JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

/**
 * Verify admin JWT using isolated ADMIN_JWT_SECRET.
 */
export const verifyAdminToken = (token: string): AdminTokenPayload | null => {
  try {
    return jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;
  } catch (error) {
    return null;
  }
};
