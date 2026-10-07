export type DepartmentType =
  | 'BCA'
  | 'B_TECH_AIML'
  | 'B_TECH_CSE'
  | 'B_TECH_EN'
  | 'MCA';

export type SectionType = 'A' | 'B' | 'C' | 'D';

export interface StudentUser {
  id: string;
  erpId: string;
  name: string | null;
  profileImage: string | null;
  department: DepartmentType | null;
  section: SectionType | null;
  qrTokenVersion: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  adminId: string;
  name: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthState {
  user: StudentUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileComplete: boolean;
}

export interface AdminAuthState {
  admin: AdminUser | null;
  role: 'ADMIN' | 'SUPER_ADMIN' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | Record<string, unknown> | null;
}

export const DEPARTMENT_OPTIONS: { value: DepartmentType; label: string }[] = [
  { value: 'BCA', label: 'BCA' },
  { value: 'B_TECH_AIML', label: 'B.Tech AIML' },
  { value: 'B_TECH_CSE', label: 'B.Tech CSE' },
  { value: 'B_TECH_EN', label: 'B.Tech E.N' },
  { value: 'MCA', label: 'MCA' },
];

export const SECTION_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
  { value: 'D', label: 'Section D' },
];
