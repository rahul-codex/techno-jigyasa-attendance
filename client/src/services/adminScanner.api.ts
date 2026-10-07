import api from './api';
import type { ApiResponse } from '../types/auth.types';

export interface VerifiedStudentInfo {
  id: string;
  erpId: string;
  name: string;
  profileImage: string | null;
  department: string;
  section: string;
}

export type AttendanceStatusType = 'NOT_MARKED' | 'PRESENT' | 'ABSENT' | 'NO_ACTIVE_SESSION';

export interface ScannerVerifyData {
  student: VerifiedStudentInfo;
  attendanceStatus: AttendanceStatusType;
  sessionInfo: {
    id: string;
    sessionType: string;
    status: string;
  } | null;
}

export interface MarkPresentData {
  code: string;
  recordId?: string;
}

export const adminScannerApi = {
  /**
   * Send scanned QR token to backend for cryptographic verification
   */
  async verifyQr(qrToken: string): Promise<ApiResponse<ScannerVerifyData>> {
    const res = await api.post<ApiResponse<ScannerVerifyData>>('/admin/scanner/verify', { qrToken });
    return res.data;
  },

  /**
   * Explicitly mark student attendance after admin confirmation
   */
  async markPresent(qrToken: string): Promise<ApiResponse<MarkPresentData>> {
    const res = await api.post<ApiResponse<MarkPresentData>>('/admin/scanner/mark-present', { qrToken });
    return res.data;
  },
};
