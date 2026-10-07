import { Request, Response } from 'express';
import { StudentAuthService } from '../services/studentAuth.service';
import { ApiResponse } from '../utils/apiResponse.util';
import { env } from '../config/env';

export class StudentAuthController {
  /**
   * POST /api/auth/student/register
   */
  static async register(req: Request, res: Response) {
    try {
      const { erpId, password } = req.body;
      const student = await StudentAuthService.register(erpId, password);

      return ApiResponse.success(
        res,
        'Registration successful. You can now log in.',
        { student },
        201
      );
    } catch (error: any) {
      if (error.message === 'This ERP ID is already registered.') {
        return ApiResponse.error(res, error.message, 409);
      }
      return ApiResponse.error(
        res,
        error.message || 'An error occurred during registration. Please try again.',
        400
      );
    }
  }

  /**
   * POST /api/auth/student/login
   */
  static async login(req: Request, res: Response) {
    try {
      const { erpId, password } = req.body;
      const { student, token } = await StudentAuthService.login(erpId, password);

      // Set secure httpOnly cookie (No tokens stored in browser localStorage)
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return ApiResponse.success(res, 'Login successful.', {
        student,
        role: 'STUDENT',
      });
    } catch (error: any) {
      if (error.message.includes('currently inactive')) {
        return ApiResponse.error(res, error.message, 403);
      }
      return ApiResponse.error(
        res,
        error.message || 'Invalid ERP ID or password.',
        401
      );
    }
  }

  /**
   * POST /api/auth/student/logout
   */
  static async logout(_req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return ApiResponse.success(res, 'Logged out successfully.');
  }

  /**
   * GET /api/auth/student/me
   */
  static async getMe(req: Request, res: Response) {
    if (!req.student) {
      return ApiResponse.error(res, 'Authentication required.', 401);
    }

    return ApiResponse.success(res, 'Current session retrieved.', {
      student: req.student,
      role: 'STUDENT',
    });
  }
}
