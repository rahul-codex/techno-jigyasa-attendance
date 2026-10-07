import prisma from '../config/db';
import { Department, Section } from '@prisma/client';
import { SafeStudent } from '../types/auth.types';
import { deleteFileSafely } from '../utils/file.util';

export interface ProfileWithStatus {
  student: SafeStudent;
  isProfileComplete: boolean;
}

export class StudentProfileService {
  /**
   * Helper to evaluate profile completeness according to required fields.
   */
  static isComplete(student: Partial<SafeStudent> | null): boolean {
    if (!student) return false;
    return Boolean(
      student.name &&
      student.name.trim().length >= 2 &&
      student.department &&
      student.section &&
      student.profileImage
    );
  }

  /**
   * Retrieve current student profile.
   */
  static async getProfile(studentId: string): Promise<ProfileWithStatus> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
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

    if (!student) {
      throw new Error('Student account not found.');
    }

    return {
      student,
      isProfileComplete: this.isComplete(student),
    };
  }

  /**
   * Update student profile fields (Name, Department, Section).
   * ERP ID, password, role, status cannot be changed here.
   */
  static async updateProfile(
    studentId: string,
    data: {
      name: string;
      department: Department;
      section: Section;
    }
  ): Promise<ProfileWithStatus> {
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        name: data.name.trim(),
        department: data.department,
        section: data.section,
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

    return {
      student: updatedStudent,
      isProfileComplete: this.isComplete(updatedStudent),
    };
  }

  /**
   * Upload / update student profile photo.
   * Cleans up old photo file safely to prevent disk bloating.
   */
  static async updateProfileImage(
    studentId: string,
    imageFilename: string
  ): Promise<ProfileWithStatus> {
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
      select: { profileImage: true },
    });

    // Delete old photo if it exists
    if (existing?.profileImage) {
      await deleteFileSafely(existing.profileImage);
    }

    const publicUrl = `/uploads/profiles/${imageFilename}`;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        profileImage: publicUrl,
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

    return {
      student: updatedStudent,
      isProfileComplete: this.isComplete(updatedStudent),
    };
  }

  /**
   * Remove student profile photo.
   */
  static async removeProfileImage(studentId: string): Promise<ProfileWithStatus> {
    const existing = await prisma.student.findUnique({
      where: { id: studentId },
      select: { profileImage: true },
    });

    if (existing?.profileImage) {
      await deleteFileSafely(existing.profileImage);
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        profileImage: null,
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

    return {
      student: updatedStudent,
      isProfileComplete: this.isComplete(updatedStudent),
    };
  }
}
