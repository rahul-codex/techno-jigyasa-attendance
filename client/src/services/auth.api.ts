import api from './api';
import type { ApiResponse, StudentUser, UserRole } from '../types/auth.types';

export interface RegisterPayload {
  erpId: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  erpId: string;
  password: string;
}

export interface AuthSessionResponse {
  student: StudentUser;
  role: UserRole;
}

export const studentAuthApi = {
  async register(payload: RegisterPayload): Promise<ApiResponse<{ student: StudentUser }>> {
    const res = await api.post<ApiResponse<{ student: StudentUser }>>('/auth/student/register', payload);
    return res.data;
  },

  async login(payload: LoginPayload): Promise<ApiResponse<AuthSessionResponse>> {
    const res = await api.post<ApiResponse<AuthSessionResponse>>('/auth/student/login', payload);
    return res.data;
  },

  async logout(): Promise<ApiResponse<void>> {
    const res = await api.post<ApiResponse<void>>('/auth/student/logout');
    return res.data;
  },

  async getMe(): Promise<ApiResponse<AuthSessionResponse>> {
    const res = await api.get<ApiResponse<AuthSessionResponse>>('/auth/student/me');
    return res.data;
  },
};
