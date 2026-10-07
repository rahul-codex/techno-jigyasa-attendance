import api from './api';
import type { ApiResponse, StudentUser } from '../types/auth.types';

export interface QrApiResponseData {
  qrToken: string;
  qrDataUrl: string;
  qrTokenVersion: number;
  student: StudentUser;
}

export interface CardApiResponseData {
  clubName: string;
  title: string;
  student: {
    name: string | null;
    erpId: string;
    department: string | null;
    section: string | null;
    profileImage: string | null;
    qrTokenVersion: number;
  };
  qrDataUrl: string;
  instructions: string;
}

export const studentQrApi = {
  async getQr(): Promise<ApiResponse<QrApiResponseData>> {
    const res = await api.get<ApiResponse<QrApiResponseData>>('/student/qr');
    return res.data;
  },

  async regenerateQr(): Promise<ApiResponse<QrApiResponseData>> {
    const res = await api.post<ApiResponse<QrApiResponseData>>('/student/qr/regenerate');
    return res.data;
  },

  async getCard(): Promise<ApiResponse<CardApiResponseData>> {
    const res = await api.get<ApiResponse<CardApiResponseData>>('/student/qr/card');
    return res.data;
  },
};
