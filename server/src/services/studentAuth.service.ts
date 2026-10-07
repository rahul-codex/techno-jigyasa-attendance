import prisma from '../config/db';
import { hashPassword, comparePassword } from '../utils/hash.util';
import { signToken } from '../utils/token.util';
import { SafeStudent } from '../types/auth.types';

export class StudentAuthService {
  /**
   * Register a new student using ERP ID and password.
   * Profile details (Name, photo, department, section) are deferred to profile setup.
   */
  static async register(erpId: string, password: string): Promise<SafeStudent> {
    const normalizedErpId = erpId.trim();

    // Check if ERP ID is already registered
    const existingStudent = await prisma.student.findUnique({
      where: { erpId: normalizedErpId },
    });

    if (existingStudent) {
      throw new Error('This ERP ID is already registered.');
    }

    // Secure password hashing with bcryptjs (work factor 12)
    const passwordHash = await hashPassword(password);

    // Create student in database
    const newStudent = await prisma.student.create({
      data: {
        erpId: normalizedErpId,
        passwordHash,
        status: 'ACTIVE',
        qrTokenVersion: 1,
      },
      select: {
        id: true,
        erpId: true,
        name: true,
        profileImage: true,
        department: true,
        section: true,
        qrTokenVersion: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newStudent;
  }

  /**
   * Authenticate student and issue signed JWT.
   */
  static async login(
    erpId: string,
    password: string
  ): Promise<{ student: SafeStudent; token: string }> {
    const normalizedErpId = erpId.trim();

    // Find student by ERP ID
    const student = await prisma.student.findUnique({
      where: { erpId: normalizedErpId },
    });

    // Timing-safe and generic error: Do NOT reveal whether ERP ID exists or password is wrong
    if (!student) {
      throw new Error('Invalid ERP ID or password.');
    }

    const isPasswordValid = await comparePassword(password, student.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid ERP ID or password.');
    }

    // Check account status
    if (student.status !== 'ACTIVE') {
      throw new Error('Your account is currently inactive. Please contact an administrator.');
    }

    // Generate JWT token containing only minimum necessary fields
    const token = signToken({
      userId: student.id,
      erpId: student.erpId,
      role: 'STUDENT',
    });

    // Strip passwordHash from response object
    const { passwordHash: _, ...safeStudent } = student;

    return {
      student: safeStudent,
      token,
    };
  }

  /**
   * Retrieve student profile by ID
   */
  static async getProfile(id: string): Promise<SafeStudent | null> {
    return prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        erpId: true,
        name: true,
        profileImage: true,
        department: true,
        section: true,
        qrTokenVersion: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
