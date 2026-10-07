import { Student, Admin } from '@prisma/client';

export type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface TokenPayload {
  userId: string;
  erpId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AdminTokenPayload {
  userId: string;
  adminId: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  iat?: number;
  exp?: number;
}

export type SafeStudent = Omit<Student, 'passwordHash'>;
export type SafeAdmin = Omit<Admin, 'passwordHash'>;

export interface AuthResponseData {
  student: SafeStudent;
  role: UserRole;
}

export interface AdminAuthResponseData {
  admin: SafeAdmin;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: (TokenPayload | AdminTokenPayload) & { role: UserRole };
      student?: SafeStudent;
      admin?: SafeAdmin;
    }
  }
}
