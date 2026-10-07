import api from './api';
import type { ApiResponse } from '../types/auth.types';

export interface StudentAttendanceSummary {
  totalClosedSessions: number;
  presentCount: number;
  absentCount: number;
  attendancePercentage: number;
}

export interface StudentAttendanceHistoryItem {
  id: string;
  date: string;
  sessionType: 'SESSION_1' | 'SESSION_2';
  sessionStatus: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
  status: 'PRESENT' | 'ABSENT';
  markedAt: string;
}

export const studentAttendanceApi = {
  /**
   * Retrieve personal attendance summary & percentage calculation
   */
  async getSummary(): Promise<ApiResponse<StudentAttendanceSummary>> {
    const res = await api.get<ApiResponse<StudentAttendanceSummary>>(
      '/student/attendance/summary'
    );
    return res.data;
  },

  /**
   * Retrieve personal attendance history
   */
  async getHistory(): Promise<ApiResponse<{ history: StudentAttendanceHistoryItem[] }>> {
    const res = await api.get<ApiResponse<{ history: StudentAttendanceHistoryItem[] }>>(
      '/student/attendance/history'
    );
    return res.data;
  },
};
