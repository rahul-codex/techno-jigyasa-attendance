import api from './api';
import type { ApiResponse, DepartmentType, SectionType } from '../types/auth.types';

export type SessionTypeEnum = 'SESSION_1' | 'SESSION_2';
export type SessionStatusEnum = 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
export type AttendanceStatusEnum = 'PRESENT' | 'ABSENT';

export interface AttendanceSessionData {
  id: string;
  date: string;
  sessionType: SessionTypeEnum;
  startTime: string;
  endTime: string;
  status: SessionStatusEnum;
  createdByAdminId: string | null;
  presentCount: number;
  absentCount: number;
  totalEligibleStudents: number;
}

export interface AttendanceRecordItem {
  id: string;
  studentId: string;
  sessionId: string;
  attendanceDate: string;
  status: AttendanceStatusEnum;
  markedAt: string;
  markedByAdminId: string;
  student: {
    id: string;
    erpId: string;
    name: string | null;
    department: DepartmentType | null;
    section: SectionType | null;
    profileImage: string | null;
    status: string;
  };
}

export interface SessionRecordsFilter {
  department?: string;
  section?: string;
  status?: string;
  search?: string;
}

export const adminAttendanceApi = {
  /**
   * Retrieve today's SESSION_1 and SESSION_2 status with count metrics
   */
  async getTodaySessions(): Promise<ApiResponse<{ sessions: AttendanceSessionData[] }>> {
    const res = await api.get<ApiResponse<{ sessions: AttendanceSessionData[] }>>(
      '/admin/attendance/sessions/today'
    );
    return res.data;
  },

  /**
   * Create today's session (SESSION_1 or SESSION_2)
   */
  async createSession(
    sessionType: SessionTypeEnum
  ): Promise<ApiResponse<{ session: AttendanceSessionData }>> {
    const res = await api.post<ApiResponse<{ session: AttendanceSessionData }>>(
      '/admin/attendance/sessions',
      { sessionType }
    );
    return res.data;
  },

  /**
   * Start a SCHEDULED session
   */
  async startSession(
    sessionId: string
  ): Promise<ApiResponse<{ session: AttendanceSessionData }>> {
    const res = await api.post<ApiResponse<{ session: AttendanceSessionData }>>(
      `/admin/attendance/sessions/${sessionId}/start`
    );
    return res.data;
  },

  /**
   * Close an ACTIVE session and trigger automatic absent reconciliation
   */
  async closeSession(
    sessionId: string
  ): Promise<ApiResponse<{ session: AttendanceSessionData }>> {
    const res = await api.post<ApiResponse<{ session: AttendanceSessionData }>>(
      `/admin/attendance/sessions/${sessionId}/close`
    );
    return res.data;
  },

  /**
   * Retrieve specific session info
   */
  async getSessionById(
    sessionId: string
  ): Promise<ApiResponse<{ session: AttendanceSessionData }>> {
    const res = await api.get<ApiResponse<{ session: AttendanceSessionData }>>(
      `/admin/attendance/sessions/${sessionId}`
    );
    return res.data;
  },

  /**
   * Retrieve filtered attendance records for a session
   */
  async getSessionRecords(
    sessionId: string,
    filters?: SessionRecordsFilter
  ): Promise<ApiResponse<{ records: AttendanceRecordItem[] }>> {
    const res = await api.get<ApiResponse<{ records: AttendanceRecordItem[] }>>(
      `/admin/attendance/sessions/${sessionId}/records`,
      { params: filters }
    );
    return res.data;
  },

  /**
   * Admin manual attendance correction (for closed sessions)
   */
  async correctRecord(
    recordId: string,
    status: AttendanceStatusEnum
  ): Promise<ApiResponse<{ record: AttendanceRecordItem }>> {
    const res = await api.patch<ApiResponse<{ record: AttendanceRecordItem }>>(
      `/admin/attendance/records/${recordId}`,
      { status }
    );
    return res.data;
  },
};
