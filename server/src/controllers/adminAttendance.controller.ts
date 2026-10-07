import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { ApiResponse } from '../utils/apiResponse.util';

export class AdminAttendanceController {
  /**
   * POST /api/admin/attendance/sessions
   * Create today's session (SESSION_1 or SESSION_2)
   */
  static async createSession(req: Request, res: Response) {
    try {
      const { sessionType } = req.body;
      const adminId = req.admin?.id || (req.user as any)?.userId;

      if (!adminId) {
        return ApiResponse.error(res, 'Admin authentication required.', 401);
      }

      const session = await AttendanceService.createSession(sessionType, adminId);

      return ApiResponse.success(
        res,
        `${sessionType === 'SESSION_1' ? 'Morning' : 'Afternoon'} session created successfully.`,
        { session },
        201
      );
    } catch (error: any) {
      if (error.code === 'SESSION_ALREADY_EXISTS') {
        return ApiResponse.error(res, error.message, 409, { code: error.code });
      }
      return ApiResponse.error(
        res,
        error.message || 'Failed to create attendance session.',
        400
      );
    }
  }

  /**
   * POST /api/admin/attendance/sessions/:sessionId/start
   * Start a scheduled session. Enforces only one active session for today.
   */
  static async startSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const adminId = req.admin?.id || (req.user as any)?.userId;

      if (!adminId) {
        return ApiResponse.error(res, 'Admin authentication required.', 401);
      }

      const session = await AttendanceService.startSession(sessionId, adminId);

      return ApiResponse.success(res, 'Session started successfully. Ready to accept attendance scans.', {
        session,
      });
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message || 'Failed to start attendance session.',
        400,
        { code: error.code }
      );
    }
  }

  /**
   * POST /api/admin/attendance/sessions/:sessionId/close
   * Close session and atomically reconcile unrecorded students as ABSENT.
   */
  static async closeSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const adminId = req.admin?.id || (req.user as any)?.userId;

      if (!adminId) {
        return ApiResponse.error(res, 'Admin authentication required.', 401);
      }

      const session = await AttendanceService.closeSession(sessionId, adminId);

      return ApiResponse.success(
        res,
        'Session closed successfully. Absent reconciliation complete.',
        { session }
      );
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message || 'Failed to close attendance session.',
        400,
        { code: error.code }
      );
    }
  }

  /**
   * GET /api/admin/attendance/sessions/today
   * Retrieve today's SESSION_1 and SESSION_2 status with count metrics.
   */
  static async getTodaySessions(_req: Request, res: Response) {
    try {
      const sessions = await AttendanceService.getTodaySessions();
      return ApiResponse.success(res, "Today's attendance sessions retrieved.", { sessions });
    } catch (error: any) {
      return ApiResponse.error(
        res,
        error.message || "Failed to retrieve today's attendance sessions.",
        500
      );
    }
  }

  /**
   * GET /api/admin/attendance/sessions/:sessionId
   * Retrieve session information and attendance summary.
   */
  static async getSessionById(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const session = await AttendanceService.getSessionById(sessionId);

      return ApiResponse.success(res, 'Session details retrieved.', { session });
    } catch (error: any) {
      const statusCode = error.code === 'SESSION_NOT_FOUND' ? 404 : 400;
      return ApiResponse.error(res, error.message || 'Failed to retrieve session.', statusCode);
    }
  }

  /**
   * GET /api/admin/attendance/sessions/:sessionId/records
   * Retrieve attendance records for a session with optional filters.
   */
  static async getSessionRecords(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { department, section, status, search } = req.query;

      const records = await AttendanceService.getSessionRecords(sessionId, {
        department: department as any,
        section: section as any,
        status: status as any,
        search: search as string,
      });

      return ApiResponse.success(res, 'Attendance records retrieved.', { records });
    } catch (error: any) {
      const statusCode = error.code === 'SESSION_NOT_FOUND' ? 404 : 400;
      return ApiResponse.error(
        res,
        error.message || 'Failed to retrieve attendance records.',
        statusCode
      );
    }
  }

  /**
   * PATCH /api/admin/attendance/records/:recordId
   * Admin manual correction for attendance record (closed sessions only).
   */
  static async correctRecord(req: Request, res: Response) {
    try {
      const { recordId } = req.params;
      const { status } = req.body;
      const adminId = req.admin?.id || (req.user as any)?.userId;

      if (!adminId) {
        return ApiResponse.error(res, 'Admin authentication required.', 401);
      }

      const updatedRecord = await AttendanceService.correctRecord(recordId, status, adminId);

      return ApiResponse.success(res, 'Attendance record updated successfully.', {
        record: updatedRecord,
      });
    } catch (error: any) {
      const statusCode = error.code === 'RECORD_NOT_FOUND' ? 404 : 400;
      return ApiResponse.error(
        res,
        error.message || 'Failed to correct attendance record.',
        statusCode,
        { code: error.code }
      );
    }
  }
}
