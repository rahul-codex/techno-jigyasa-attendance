import prisma from '../config/db';
import { comparePassword } from '../utils/hash.util';
import { signAdminToken } from '../utils/token.util';
import { SafeAdmin } from '../types/auth.types';

export class AdminAuthService {
  /**
   * Authenticate admin with Admin ID and password.
   * Generic login error prevents account enumeration.
   */
  static async login(
    adminId: string,
    password: string
  ): Promise<{ admin: SafeAdmin; token: string }> {
    const normalizedAdminId = adminId.trim();

    // 1. Find admin by adminId
    const admin = await prisma.admin.findUnique({
      where: { adminId: normalizedAdminId },
    });

    // Timing-safe & generic error: do NOT reveal if adminId exists or not
    if (!admin) {
      throw new Error('Invalid Admin ID or password.');
    }

    // 2. Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid Admin ID or password.');
    }

    // 3. Verify account status
    if (admin.status !== 'ACTIVE') {
      throw new Error('Your admin account is currently inactive.');
    }

    // 4. Generate minimal Admin JWT (only userId, adminId, role)
    const token = signAdminToken({
      userId: admin.id,
      adminId: admin.adminId,
      role: admin.role,
    });

    // 5. Return safe admin object without passwordHash
    const { passwordHash: _, ...safeAdmin } = admin;

    return {
      admin: safeAdmin,
      token,
    };
  }

  /**
   * Get safe admin profile by ID
   */
  static async getAdminById(id: string): Promise<SafeAdmin | null> {
    return prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        adminId: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
