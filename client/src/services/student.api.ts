import api from './api';
import type { ApiResponse, StudentUser, DepartmentType, SectionType } from '../types/auth.types';

export interface ProfileResponseData {
  student: StudentUser;
  isProfileComplete: boolean;
}

export interface UpdateProfilePayload {
  name: string;
  department: DepartmentType;
  section: SectionType;
}

export const studentApi = {
  async getProfile(): Promise<ApiResponse<ProfileResponseData>> {
    const res = await api.get<ApiResponse<ProfileResponseData>>('/student/profile');
    return res.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<ProfileResponseData>> {
    const res = await api.put<ApiResponse<ProfileResponseData>>('/student/profile', payload);
    return res.data;
  },

  async uploadProfileImage(file: File): Promise<ApiResponse<ProfileResponseData>> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post<ApiResponse<ProfileResponseData>>('/student/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async deleteProfileImage(): Promise<ApiResponse<ProfileResponseData>> {
    const res = await api.delete<ApiResponse<ProfileResponseData>>('/student/profile/image');
    return res.data;
  },
};
