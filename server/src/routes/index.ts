import { Router } from 'express';
import studentAuthRoutes from './studentAuth.routes';
import studentProfileRoutes from './studentProfile.routes';
import studentQrRoutes from './studentQr.routes';
import studentAttendanceRoutes from './studentAttendance.routes';
import adminAuthRoutes from './adminAuth.routes';
import adminScannerRoutes from './adminScanner.routes';
import adminAttendanceRoutes from './adminAttendance.routes';

const router = Router();

// Student Auth Routes (/api/auth/student/register, /api/auth/student/login, etc.)
router.use('/auth/student', studentAuthRoutes);

// Admin Auth Routes (/api/auth/admin/login, /api/auth/admin/logout, /api/auth/admin/me)
router.use('/auth/admin', adminAuthRoutes);

// Admin QR Scanner Routes (/api/admin/scanner/verify, /api/admin/scanner/mark-present)
router.use('/admin/scanner', adminScannerRoutes);

// Admin Attendance Management Routes (/api/admin/attendance/sessions, etc.)
router.use('/admin/attendance', adminAttendanceRoutes);

// Student Profile Management Routes (/api/student/profile, etc.)
router.use('/student', studentProfileRoutes);

// Student QR Code Routes (/api/student/qr, /api/student/qr/regenerate, /api/student/qr/card)
router.use('/student', studentQrRoutes);

// Student Attendance History & Summary Routes (/api/student/attendance/summary, etc.)
router.use('/student/attendance', studentAttendanceRoutes);

export default router;
