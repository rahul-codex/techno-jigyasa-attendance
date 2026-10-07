import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { ApiResponse } from '../utils/apiResponse.util';

export class StudentAttendanceController {
  /**
   * GET /api/student/attendance/summary
   * Retrieve total closed sessions, present count, absent count, and attendance percentage.
   */
  static async getSummary(req: Request, res: Response) {
    try {
      const studentId = req.student?.id || (req.user as any)?.userId;

      if (!studentId) {
        return ApiResponse.error(res, 'Student authentication required.', 401);
      }

      const summary = await AttendanceService.getStudentAttendanceSummary(studentId);

      return ApiResponse.success(res, 'Attendance summary retrieved.', summary);
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message || 'Failed to retrieve attendance summary.',
        500
      );
    }
  }

  /**
   * GET /api/student/attendance/history
   * Retrieve chronological attendance records for the authenticated student.
   */
  static async getHistory(req: Request, res: Response) {
    try {
      const studentId = req.student?.id || (req.user as any)?.userId;

      if (!studentId) {
        return ApiResponse.error(res, 'Student authentication required.', 401);
      }

      const history = await AttendanceService.getStudentAttendanceHistory(studentId);

      return ApiResponse.success(res, 'Attendance history retrieved.', { history });
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message || 'Failed to retrieve attendance history.',
        500
      );
    }
  }
}
