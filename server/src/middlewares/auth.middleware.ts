import { Request, Response, NextFunction } from 'express';
import { verifyToken, verifyAdminToken } from '../utils/token.util';
import { ApiResponse } from '../utils/apiResponse.util';
import prisma from '../config/db';
import { SafeAdmin, SafeStudent } from '../types/auth.types';

/**
 * Universal authentication middleware.
 * Validates session cookie or Bearer token for students or admins.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract token from cookies or Authorization Bearer header
    let token = req.cookies?.admin_token || req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 'Authentication required. Please log in.', 401);
    }

    // 2. Try verifying as Admin token first
    const adminDecoded = verifyAdminToken(token);
    if (adminDecoded && (adminDecoded.role === 'ADMIN' || adminDecoded.role === 'SUPER_ADMIN')) {
      const admin = await prisma.admin.findUnique({
        where: { id: adminDecoded.userId },
        select: {
          id: true,
          adminId: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!admin) {
        return ApiResponse.error(res, 'Admin account not found.', 401);
      }

      if (admin.status !== 'ACTIVE') {
        return ApiResponse.error(res, 'Your admin account is currently inactive.', 403);
      }

      req.user = adminDecoded;
      req.admin = admin as SafeAdmin;
      return next();
    }

    // 3. Try verifying as Student token
    const studentDecoded = verifyToken(token);
    if (studentDecoded && studentDecoded.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { id: studentDecoded.userId },
        select: {
          id: true,
          erpId: true,
          name: true,
          profileImage: true,
          department: true,
          section: true,
          qrTokenVersion: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!student) {
        return ApiResponse.error(res, 'Student account not found.', 401);
      }

      if (student.status !== 'ACTIVE') {
        return ApiResponse.error(
          res,
          'Your account is currently inactive. Please contact an administrator.',
          403
        );
      }

      req.user = studentDecoded;
      req.student = student as SafeStudent;
      return next();
    }

    return ApiResponse.error(res, 'Invalid or expired session. Please log in again.', 401);
  } catch (error) {
    return ApiResponse.error(res, 'Authentication verification failed.', 401);
  }
};

/**
 * Dedicated Admin Authentication Middleware
 * Specifically validates admin_token cookie or Bearer header.
 * Rejects non-admin attempts with HTTP 403 Forbidden.
 */
export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.cookies?.admin_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if student token was supplied instead
    if (!token) {
      if (req.cookies?.token) {
        const studentCheck = verifyToken(req.cookies.token);
        if (studentCheck && studentCheck.role === 'STUDENT') {
          return ApiResponse.error(
            res,
            'Access denied. You do not have permission to access this resource.',
            403
          );
        }
      }
      return ApiResponse.error(res, 'Admin authentication required. Please log in.', 401);
    }

    // Verify token with ADMIN_JWT_SECRET
    const decoded = verifyAdminToken(token);
    if (!decoded) {
      const studentCheck = verifyToken(token);
      if (studentCheck && studentCheck.role === 'STUDENT') {
        return ApiResponse.error(
          res,
          'Access denied. You do not have permission to access this resource.',
          403
        );
      }
      return ApiResponse.error(res, 'Invalid or expired admin session. Please log in again.', 401);
    }

    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return ApiResponse.error(
        res,
        'Access denied. You do not have permission to access this resource.',
        403
      );
    }

    // Verify admin in database
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        adminId: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return ApiResponse.error(res, 'Admin account not found.', 401);
    }

    if (admin.status !== 'ACTIVE') {
      return ApiResponse.error(res, 'Your admin account is currently inactive.', 403);
    }

    req.user = decoded;
    req.admin = admin as SafeAdmin;
    return next();
  } catch (error) {
    return ApiResponse.error(res, 'Admin authentication verification failed.', 401);
  }
};
