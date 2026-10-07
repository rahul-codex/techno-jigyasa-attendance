import api from './api';
import type { ApiResponse, AdminUser } from '../types/auth.types';

export interface AdminLoginPayload {
  adminId: string;
  password: string;
}

export interface AdminAuthSessionResponse {
  admin: AdminUser;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export const adminAuthApi = {
  /**
   * Authenticate admin via Admin ID and Password
   */
  async login(payload: AdminLoginPayload): Promise<ApiResponse<AdminAuthSessionResponse>> {
    const res = await api.post<ApiResponse<AdminAuthSessionResponse>>('/auth/admin/login', payload);
    return res.data;
  },

  /**
   * Log out admin and clear admin_token cookie
   */
  async logout(): Promise<ApiResponse<void>> {
    const res = await api.post<ApiResponse<void>>('/auth/admin/logout');
    return res.data;
  },

  /**
   * Get active admin session via httpOnly cookie
   */
  async getMe(): Promise<ApiResponse<AdminAuthSessionResponse>> {
    const res = await api.get<ApiResponse<AdminAuthSessionResponse>>('/auth/admin/me');
    return res.data;
  },
};
