import { Request, Response } from 'express';
import { AdminScannerService } from '../services/adminScanner.service';
import { ApiResponse } from '../utils/apiResponse.util';

export class AdminScannerController {
  /**
   * POST /api/admin/scanner/verify
   * Verify scanned student QR token and retrieve safe student info & attendance status.
   */
  static async verify(req: Request, res: Response) {
    try {
      const { qrToken } = req.body;
      const adminId = req.admin?.id || (req.user as any)?.userId;

      if (!adminId) {
        return ApiResponse.error(res, 'Admin authentication required.', 401);
      }

      const data = await AdminScannerService.verifyQr(qrToken, adminId);

      return ApiResponse.success(res, 'Student verified successfully.', {
        student: data.student,
        attendanceStatus: data.attendanceStatus,
        sessionInfo: data.sessionInfo,
      });
    } catch (error: any) {
      const statusCode =
        error.code === 'STUDENT_NOT_FOUND'
          ? 404
          : error.code === 'STUDENT_INACTIVE'
          ? 403
          : 400;

      return ApiResponse.error(
        res,
        error.message || 'QR code verification failed.',
        statusCode,
        {
          code: error.code || 'INVALID_QR',
        }
      );
    }
  }

  /**
   * POST /api/admin/scanner/mark-present
   * Explicit attendance marking after admin clicks MARK PRESENT button.
   */
  static async markPresent(req: Request, res: Response) {
    try {
      const { qrToken } = req.body;
      const adminId = req.admin?.id || (req.user as any)?.userId;

      if (!adminId) {
        return ApiResponse.error(res, 'Admin authentication required.', 401);
      }

      const result = await AdminScannerService.markPresent(qrToken, adminId);

      if (!result.success) {
        return res.status(200).json({
          success: false,
          code: result.code,
          message: result.message,
        });
      }

      return ApiResponse.success(res, result.message, {
        code: result.code,
        recordId: result.recordId,
      });
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message || 'Failed to mark attendance.',
        400,
        {
          code: error.code || 'MARK_ATTENDANCE_FAILED',
        }
      );
    }
  }
}
