import { Router } from 'express';
import { StudentAttendanceController } from '../controllers/studentAttendance.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireStudent } from '../middlewares/rbac.middleware';

const router = Router();

// Protect student attendance endpoints: Require Student Authentication & Student Role
router.use(requireAuth);
router.use(requireStudent);

// GET /api/student/attendance/summary - Retrieve attendance statistics & percentage
router.get('/summary', StudentAttendanceController.getSummary);

// GET /api/student/attendance/history - Retrieve personal attendance history
router.get('/history', StudentAttendanceController.getHistory);

export default router;
