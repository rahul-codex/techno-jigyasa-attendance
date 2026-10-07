import prisma from '../config/db';
import { SessionType, SessionStatus, AttendanceStatus, Department, Section } from '@prisma/client';
import { getTodayDate } from '../utils/date.util';
import { StudentProfileService } from './studentProfile.service';

export interface AttendanceRecordFilterOptions {
  department?: Department;
  section?: Section;
  status?: AttendanceStatus;
  search?: string;
}

export class AttendanceService {
  /**
   * Create a daily session (SESSION_1 = Morning, SESSION_2 = Afternoon).
   * Enforces exact daily limit of one Morning and one Afternoon session.
   */
  static async createSession(
    sessionType: SessionType,
    adminId: string
  ) {
    const today = getTodayDate();

    // Check if session for this type already exists today
    const existingSession = await prisma.attendanceSession.findUnique({
      where: {
        unique_date_session_type: {
          date: today,
          sessionType,
        },
      },
    });

    if (existingSession) {
      const friendlyName = sessionType === 'SESSION_1' ? 'Morning Session' : 'Afternoon Session';
      const error = new Error(`${friendlyName} already exists for today.`) as any;
      error.code = 'SESSION_ALREADY_EXISTS';
      throw error;
    }

    // Set planned window times
    const startTime = new Date(today);
    const endTime = new Date(today);

    if (sessionType === 'SESSION_1') {
      startTime.setUTCHours(9, 0, 0, 0); // 09:00 IST equivalent
      endTime.setUTCHours(12, 0, 0, 0);  // 12:00 IST equivalent
    } else {
      startTime.setUTCHours(13, 0, 0, 0); // 13:00 IST equivalent
      endTime.setUTCHours(16, 0, 0, 0);  // 16:00 IST equivalent
    }

    const session = await prisma.attendanceSession.create({
      data: {
        date: today,
        sessionType,
        startTime,
        endTime,
        status: 'SCHEDULED',
        createdByAdminId: adminId,
      },
    });

    // Create Audit Log
    try {
      await prisma.activityLog.create({
        data: {
          adminId,
          action: 'SESSION_CREATED',
          metadata: {
            sessionId: session.id,
            sessionType,
            date: today.toISOString(),
          },
        },
      });
    } catch {
      // Non-fatal
    }

    return session;
  }

  /**
   * Start a SCHEDULED attendance session.
   * Enforces that only one session can be ACTIVE at a time for today.
   */
  static async startSession(sessionId: string, adminId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      const error = new Error('Attendance session not found.') as any;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    if (session.status === 'ACTIVE') {
      const error = new Error('Session is already active.') as any;
      error.code = 'SESSION_ALREADY_ACTIVE';
      throw error;
    }

    if (session.status === 'CLOSED') {
      const error = new Error('Cannot start a closed session.') as any;
      error.code = 'CANNOT_START_CLOSED_SESSION';
      throw error;
    }

    // Ensure no other session is active for today
    const otherActiveSession = await prisma.attendanceSession.findFirst({
      where: {
        date: session.date,
        status: 'ACTIVE',
        id: { not: sessionId },
      },
    });

    if (otherActiveSession) {
      const error = new Error(
        'Another session is currently active. Please close it before starting a new session.'
      ) as any;
      error.code = 'ANOTHER_SESSION_ACTIVE';
      throw error;
    }

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
        startTime: new Date(),
      },
    });

    // Create Audit Log
    try {
      await prisma.activityLog.create({
        data: {
          adminId,
          action: 'SESSION_STARTED',
          metadata: {
            sessionId,
            sessionType: session.sessionType,
            startedAt: new Date().toISOString(),
          },
        },
      });
    } catch {
      // Non-fatal
    }

    return updatedSession;
  }

  /**
   * Close an ACTIVE attendance session.
   * Performs atomic Absent Reconciliation:
   * Identifies all active students with completed profiles who have no PRESENT record,
   * and creates ABSENT records for them.
   */
  static async closeSession(sessionId: string, adminId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      const error = new Error('Attendance session not found.') as any;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    if (session.status === 'CLOSED') {
      const error = new Error('Session is already closed.') as any;
      error.code = 'SESSION_ALREADY_CLOSED';
      throw error;
    }

    if (session.status === 'SCHEDULED') {
      const error = new Error('Cannot close a scheduled session. Start it first.') as any;
      error.code = 'CANNOT_CLOSE_SCHEDULED_SESSION';
      throw error;
    }

    // Transactional closure and absent reconciliation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update session status to CLOSED
      const closed = await tx.attendanceSession.update({
        where: { id: sessionId },
        data: {
          status: 'CLOSED',
          endTime: new Date(),
        },
      });

      // 2. Fetch all ACTIVE students
      const activeStudents = await tx.student.findMany({
        where: { status: 'ACTIVE' },
      });

      // 3. Filter strictly for complete profiles
      const eligibleStudents = activeStudents.filter((s) =>
        StudentProfileService.isComplete(s)
      );

      // 4. Query students who already have an attendance record for this session
      const existingRecords = await tx.attendanceRecord.findMany({
        where: { sessionId },
        select: { studentId: true },
      });
      const recordedStudentIds = new Set(existingRecords.map((r) => r.studentId));

      // 5. Eligible students without records become ABSENT
      const absentStudents = eligibleStudents.filter((s) => !recordedStudentIds.has(s.id));

      if (absentStudents.length > 0) {
        await tx.attendanceRecord.createMany({
          data: absentStudents.map((s) => ({
            studentId: s.id,
            sessionId,
            attendanceDate: closed.date,
            status: 'ABSENT' as const,
            markedByAdminId: adminId,
            markedAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }

      // 6. Record Audit Log
      await tx.activityLog.create({
        data: {
          adminId,
          action: 'SESSION_CLOSED',
          metadata: {
            sessionId,
            sessionType: closed.sessionType,
            absentReconciled: absentStudents.length,
            closedAt: new Date().toISOString(),
          },
        },
      });

      return {
        session: closed,
        absentCount: absentStudents.length,
      };
    });

    return result.session;
  }

  /**
   * Retrieve today's sessions with summary statistics.
   */
  static async getTodaySessions() {
    const today = getTodayDate();

    const sessions = await prisma.attendanceSession.findMany({
      where: { date: today },
      orderBy: { sessionType: 'asc' },
      include: {
        records: {
          select: { status: true },
        },
      },
    });

    // Count eligible students (Active with Complete Profile)
    const activeStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
    });
    const totalEligible = activeStudents.filter((s) =>
      StudentProfileService.isComplete(s)
    ).length;

    return sessions.map((session) => {
      const presentCount = session.records.filter((r) => r.status === 'PRESENT').length;
      const absentCount = session.records.filter((r) => r.status === 'ABSENT').length;
      const { records: _, ...cleanSession } = session;

      return {
        ...cleanSession,
        presentCount,
        absentCount,
        totalEligibleStudents: totalEligible,
      };
    });
  }

  /**
   * Get session by ID with attendance count metrics.
   */
  static async getSessionById(sessionId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        records: {
          select: { status: true },
        },
      },
    });

    if (!session) {
      const error = new Error('Attendance session not found.') as any;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    const activeStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
    });
    const totalEligible = activeStudents.filter((s) =>
      StudentProfileService.isComplete(s)
    ).length;

    const presentCount = session.records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = session.records.filter((r) => r.status === 'ABSENT').length;
    const { records: _, ...cleanSession } = session;

    return {
      ...cleanSession,
      presentCount,
      absentCount,
      totalEligibleStudents: totalEligible,
    };
  }

  /**
   * Get attendance records for a session with optional filters.
   * Strips all passwords, hashes, and secrets.
   */
  static async getSessionRecords(
    sessionId: string,
    filters: AttendanceRecordFilterOptions = {}
  ) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      const error = new Error('Attendance session not found.') as any;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    const whereClause: any = { sessionId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.department || filters.section || filters.search) {
      whereClause.student = {};
      if (filters.department) whereClause.student.department = filters.department;
      if (filters.section) whereClause.student.section = filters.section;
      if (filters.search) {
        whereClause.student.OR = [
          { erpId: { contains: filters.search.trim(), mode: 'insensitive' } },
          { name: { contains: filters.search.trim(), mode: 'insensitive' } },
        ];
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            erpId: true,
            name: true,
            department: true,
            section: true,
            profileImage: true,
            status: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PRESENT first, then ABSENT
        { markedAt: 'desc' },
      ],
    });

    return records;
  }

  /**
   * Controlled admin manual attendance correction.
   * Only allows corrections on CLOSED sessions to preserve audit validity.
   */
  static async correctRecord(
    recordId: string,
    newStatus: AttendanceStatus,
    adminId: string
  ) {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        session: true,
        student: {
          select: {
            id: true,
            erpId: true,
            name: true,
            department: true,
            section: true,
          },
        },
      },
    });

    if (!record) {
      const error = new Error('Attendance record not found.') as any;
      error.code = 'RECORD_NOT_FOUND';
      throw error;
    }

    // Enforce that corrections are strictly made on closed sessions
    if (record.session.status !== 'CLOSED') {
      const error = new Error(
        'Attendance corrections can only be made on closed sessions.'
      ) as any;
      error.code = 'CORRECTION_SESSION_NOT_CLOSED';
      throw error;
    }

    if (record.status === newStatus) {
      return record;
    }

    const previousStatus = record.status;

    const updatedRecord = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: newStatus,
        markedByAdminId: adminId,
        updatedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            erpId: true,
            name: true,
            department: true,
            section: true,
          },
        },
      },
    });

    // Record Audit Log
    try {
      await prisma.activityLog.create({
        data: {
          adminId,
          studentId: record.studentId,
          action: 'ATTENDANCE_CORRECTED',
          metadata: {
            recordId,
            sessionId: record.sessionId,
            erpId: record.student?.erpId,
            previousStatus,
            newStatus,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch {
      // Non-fatal
    }

    return updatedRecord;
  }

  /**
   * Retrieve student attendance summary.
   * Percentage formula: (Present Sessions / Total Closed Sessions) * 100
   * Excludes SCHEDULED and ACTIVE sessions from denominator.
   */
  static async getStudentAttendanceSummary(studentId: string) {
    // 1. Total CLOSED sessions in the system
    const totalClosedSessions = await prisma.attendanceSession.count({
      where: { status: 'CLOSED' },
    });

    // 2. Student's PRESENT sessions among closed sessions
    const presentCount = await prisma.attendanceRecord.count({
      where: {
        studentId,
        status: 'PRESENT',
        session: { status: 'CLOSED' },
      },
    });

    // 3. Student's ABSENT sessions among closed sessions
    const absentCount = await prisma.attendanceRecord.count({
      where: {
        studentId,
        status: 'ABSENT',
        session: { status: 'CLOSED' },
      },
    });

    // 4. Calculate Percentage
    const attendancePercentage =
      totalClosedSessions > 0
        ? Math.round((presentCount / totalClosedSessions) * 100)
        : 0;

    return {
      totalClosedSessions,
      presentCount,
      absentCount,
      attendancePercentage,
    };
  }

  /**
   * Retrieve student attendance history records.
   * Returns only safe information.
   */
  static async getStudentAttendanceHistory(studentId: string) {
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: {
          select: {
            sessionType: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: [
        { attendanceDate: 'desc' },
        { markedAt: 'desc' },
      ],
    });

    return records.map((record) => ({
      id: record.id,
      date: record.attendanceDate,
      sessionType: record.session.sessionType,
      sessionStatus: record.session.status,
      status: record.status,
      markedAt: record.markedAt,
    }));
  }
}
