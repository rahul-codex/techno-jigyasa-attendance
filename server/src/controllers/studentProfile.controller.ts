import { Request, Response } from 'express';
import { StudentProfileService } from '../services/studentProfile.service';
import { ApiResponse } from '../utils/apiResponse.util';

export class StudentProfileController {
  /**
   * GET /api/student/profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
      }

      const result = await StudentProfileService.getProfile(studentId);
      return ApiResponse.success(res, 'Profile retrieved successfully.', result);
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Failed to retrieve profile.', 500);
    }
  }

  /**
   * PUT /api/student/profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
      }

      const { name, department, section } = req.body;
      const result = await StudentProfileService.updateProfile(studentId, {
        name,
        department,
        section,
      });

      return ApiResponse.success(res, 'Profile updated successfully.', result);
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Failed to update profile.', 400);
    }
  }

  /**
   * POST /api/student/profile/image
   */
  static async uploadImage(req: Request, res: Response) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
      }

      if (!req.file) {
        return ApiResponse.error(res, 'Please provide an image file.', 400);
      }

      const result = await StudentProfileService.updateProfileImage(
        studentId,
        req.file.filename
      );

      return ApiResponse.success(res, 'Profile photo updated successfully.', result);
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Failed to upload photo.', 400);
    }
  }

  /**
   * DELETE /api/student/profile/image
   */
  static async removeImage(req: Request, res: Response) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
      }

      const result = await StudentProfileService.removeProfileImage(studentId);
      return ApiResponse.success(res, 'Profile photo removed successfully.', result);
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Failed to remove photo.', 400);
    }
  }
}
