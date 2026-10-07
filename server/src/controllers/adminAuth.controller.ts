import { Request, Response } from 'express';
import { AdminAuthService } from '../services/adminAuth.service';
import { ApiResponse } from '../utils/apiResponse.util';
import { env } from '../config/env';

export class AdminAuthController {
  /**
   * POST /api/auth/admin/login
   */
  static async login(req: Request, res: Response) {
    try {
      const { adminId, password } = req.body;
      const { admin, token } = await AdminAuthService.login(adminId, password);

      // Set secure httpOnly cookie for Admin session (isolated from student session)
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
      });

      return ApiResponse.success(res, 'Admin login successful.', {
        admin,
        role: admin.role,
      });
    } catch (error: any) {
      if (error.message?.includes('currently inactive')) {
        return ApiResponse.error(res, error.message, 403);
      }
      return ApiResponse.error(
        res,
        error.message || 'Invalid Admin ID or password.',
        401
      );
    }
  }

  /**
   * POST /api/auth/admin/logout
   */
  static async logout(_req: Request, res: Response) {
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return ApiResponse.success(res, 'Admin logged out successfully.');
  }

  /**
   * GET /api/auth/admin/me
   */
  static async getMe(req: Request, res: Response) {
    if (!req.admin) {
      return ApiResponse.error(res, 'Admin authentication required.', 401);
    }

    return ApiResponse.success(res, 'Current admin session retrieved.', {
      admin: {
        id: req.admin.id,
        adminId: req.admin.adminId,
        name: req.admin.name,
        role: req.admin.role,
        status: req.admin.status,
      },
      role: req.admin.role,
    });
  }
}
