import { Router } from 'express';
import { AdminAttendanceController } from '../controllers/adminAttendance.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createSessionSchema,
  attendanceCorrectionSchema,
} from '../validators/attendance.validator';
import { requireAdminAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/rbac.middleware';

const router = Router();

// Protect all admin attendance endpoints: Require Admin Authentication & Admin Role
router.use(requireAdminAuth);
router.use(requireAdmin);

// POST /api/admin/attendance/sessions - Create today's session
router.post(
  '/sessions',
  validateRequest(createSessionSchema),
  AdminAttendanceController.createSession
);

// POST /api/admin/attendance/sessions/:sessionId/start - Start session
router.post('/sessions/:sessionId/start', AdminAttendanceController.startSession);

// POST /api/admin/attendance/sessions/:sessionId/close - Close session and reconcile absences
router.post('/sessions/:sessionId/close', AdminAttendanceController.closeSession);

// GET /api/admin/attendance/sessions/today - Retrieve today's sessions with metrics
router.get('/sessions/today', AdminAttendanceController.getTodaySessions);

// GET /api/admin/attendance/sessions/:sessionId - Retrieve specific session info
router.get('/sessions/:sessionId', AdminAttendanceController.getSessionById);

// GET /api/admin/attendance/sessions/:sessionId/records - Retrieve filtered session attendance records
router.get('/sessions/:sessionId/records', AdminAttendanceController.getSessionRecords);

// PATCH /api/admin/attendance/records/:recordId - Correct attendance record
router.patch(
  '/records/:recordId',
  validateRequest(attendanceCorrectionSchema),
  AdminAttendanceController.correctRecord
);

export default router;
