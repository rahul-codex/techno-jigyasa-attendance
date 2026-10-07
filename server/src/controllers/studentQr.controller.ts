import { Request, Response } from 'express';
import { QrService } from '../services/qr.service';
import { ApiResponse } from '../utils/apiResponse.util';

export class StudentQrController {
  /**
   * GET /api/student/qr
   * Retrieves active QR token and high-res data URL for the authenticated student.
   */
  static async getQr(req: Request, res: Response) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
      }

      const qrData = await QrService.getStudentQr(studentId);
      return ApiResponse.success(res, 'QR code retrieved successfully.', qrData);
    } catch (error: any) {
      if (error.message.includes('complete your profile')) {
        return ApiResponse.error(res, error.message, 400, {
          requiresProfileSetup: true,
        });
      }
      return ApiResponse.error(res, error.message || 'Failed to retrieve QR code.', 500);
    }
  }

  /**
   * POST /api/student/qr/regenerate
   * Atomically increments qrTokenVersion to revoke prior codes and issue new QR.
   */
  static async regenerateQr(req: Request, res: Response) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
      }

      const qrData = await QrService.regenerateStudentQr(studentId);
      return ApiResponse.success(
        res,
        'QR code regenerated successfully. Previous QR codes have been invalidated.',
        qrData
      );
    } catch (error: any) {
      if (error.message.includes('complete your profile')) {
        return ApiResponse.error(res, error.message, 400, {
          requiresProfileSetup: true,
        });
      }
      return ApiResponse.error(res, error.message || 'Failed to regenerate QR code.', 500);
    }
  }

  /**
   * GET /api/student/qr/card
   * Returns formatted digital ID card payload.
   */
  static async getCard(req: Request, res: Response) {
    try {
      const studentId = req.user?.userId;
      if (!studentId) {
        return ApiResponse.error(res, 'Unauthorized access.', 401);
      }

      const qrData = await QrService.getStudentQr(studentId);

      const cardPayload = {
        clubName: 'TECHNO JIGYASA CLUB',
        title: 'SMART ATTENDANCE CARD',
        student: {
          name: qrData.student.name,
          erpId: qrData.student.erpId,
          department: qrData.student.department,
          section: qrData.student.section,
          profileImage: qrData.student.profileImage,
          qrTokenVersion: qrData.qrTokenVersion,
        },
        qrDataUrl: qrData.qrDataUrl,
        instructions: 'Scan by authorized club administrator only.',
      };

      return ApiResponse.success(res, 'Digital ID card data retrieved.', cardPayload);
    } catch (error: any) {
      if (error.message.includes('complete your profile')) {
        return ApiResponse.error(res, error.message, 400, {
          requiresProfileSetup: true,
        });
      }
      return ApiResponse.error(res, error.message || 'Failed to retrieve card data.', 500);
    }
  }
}
