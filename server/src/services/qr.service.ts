import crypto from 'crypto';
import QRCode from 'qrcode';
import { env } from '../config/env';
import prisma from '../config/db';
import { SafeStudent } from '../types/auth.types';
import { StudentProfileService } from './studentProfile.service';

export interface QrTokenPayload {
  app: 'TJC_ATTENDANCE';
  sub: string; // studentId
  erp: string; // student ERP ID
  v: number; // qrTokenVersion
  iat: number; // issued at timestamp (seconds)
}

export interface QrVerificationResult {
  valid: boolean;
  student?: SafeStudent;
  reason?: string;
  qrTokenVersion?: number;
}

export interface StudentQrData {
  qrToken: string;
  qrDataUrl: string;
  qrTokenVersion: number;
  student: SafeStudent;
}

export class QrService {
  /**
   * Generates a cryptographically signed, opaque QR token string.
   * Format: TJC.<base64url(payload)>.<base64url(hmac)>
   */
  static generateStudentQrToken(student: { id: string; erpId: string; qrTokenVersion: number }): string {
    const payload: QrTokenPayload = {
      app: 'TJC_ATTENDANCE',
      sub: student.id,
      erp: student.erpId,
      v: student.qrTokenVersion,
      iat: Math.floor(Date.now() / 1000),
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', env.QR_SECRET)
      .update(payloadB64)
      .digest('base64url');

    return `TJC.${payloadB64}.${signature}`;
  }

  /**
   * Verifies a scanned QR token string.
   * Future-proofed for the Admin Scanner in Step 7.
   */
  static async verifyStudentQrToken(qrString: string): Promise<QrVerificationResult> {
    try {
      if (!qrString || typeof qrString !== 'string') {
        return { valid: false, reason: 'Invalid QR token format.' };
      }

      const parts = qrString.split('.');
      if (parts.length !== 3 || parts[0] !== 'TJC') {
        return { valid: false, reason: 'Unrecognized club QR code format.' };
      }

      const [, payloadB64, providedSignature] = parts;

      // 1. Cryptographic HMAC verification
      const expectedSignature = crypto
        .createHmac('sha256', env.QR_SECRET)
        .update(payloadB64)
        .digest('base64url');

      const expectedBuffer = Buffer.from(expectedSignature);
      const providedBuffer = Buffer.from(providedSignature);

      if (
        expectedBuffer.length !== providedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
      ) {
        return { valid: false, reason: 'Invalid or forged QR signature.' };
      }

      // 2. Parse payload structure
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload: QrTokenPayload = JSON.parse(payloadJson);

      if (payload.app !== 'TJC_ATTENDANCE' || !payload.sub || typeof payload.v !== 'number') {
        return { valid: false, reason: 'Malformed QR payload structure.' };
      }

      // 3. Database lookup & version verification
      const student = await prisma.student.findUnique({
        where: { id: payload.sub },
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
        return { valid: false, reason: 'Student record not found.' };
      }

      if (student.status !== 'ACTIVE') {
        return {
          valid: false,
          reason: 'Student account is inactive. Please contact an administrator.',
        };
      }

      // Check profile completeness requirement
      if (!StudentProfileService.isComplete(student)) {
        return {
          valid: false,
          reason: 'Student profile is incomplete.',
        };
      }

      // 4. Token version check for revocation
      if (payload.v !== student.qrTokenVersion) {
        return {
          valid: false,
          reason: 'This QR code has been revoked or regenerated. Please use the newly generated QR code.',
          qrTokenVersion: student.qrTokenVersion,
        };
      }

      return {
        valid: true,
        student,
        qrTokenVersion: student.qrTokenVersion,
      };
    } catch (error) {
      return { valid: false, reason: 'Failed to parse QR token.' };
    }
  }

  /**
   * Generates a high-resolution, print-ready QR PNG data URL.
   * Uses high error correction ('H') for reliable camera scanning.
   */
  static async generateQrDataUrl(qrString: string): Promise<string> {
    return QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 10,
      color: {
        dark: '#0f172a', // Deep slate for high contrast
        light: '#ffffff',
      },
    });
  }

  /**
   * Retrieves or builds the active QR for an authenticated student.
   * Requires complete profile.
   */
  static async getStudentQr(studentId: string): Promise<StudentQrData> {
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
      throw new Error('Student record not found.');
    }

    if (student.status !== 'ACTIVE') {
      throw new Error('Your account is currently inactive. Please contact an administrator.');
    }

    // Check profile completeness requirement
    if (!StudentProfileService.isComplete(student)) {
      throw new Error('Please complete your profile before generating your QR code.');
    }

    const qrToken = this.generateStudentQrToken(student);
    const qrDataUrl = await this.generateQrDataUrl(qrToken);

    return {
      qrToken,
      qrDataUrl,
      qrTokenVersion: student.qrTokenVersion,
      student,
    };
  }

  /**
   * Atomically increments qrTokenVersion to revoke all previous QR codes.
   */
  static async regenerateStudentQr(studentId: string): Promise<StudentQrData> {
    const current = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!current) {
      throw new Error('Student record not found.');
    }

    if (current.status !== 'ACTIVE') {
      throw new Error('Your account is currently inactive. Please contact an administrator.');
    }

    if (!StudentProfileService.isComplete(current)) {
      throw new Error('Please complete your profile before generating your QR code.');
    }

    // Atomic increment of qrTokenVersion
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        qrTokenVersion: { increment: 1 },
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

    const qrToken = this.generateStudentQrToken(updatedStudent);
    const qrDataUrl = await this.generateQrDataUrl(qrToken);

    return {
      qrToken,
      qrDataUrl,
      qrTokenVersion: updatedStudent.qrTokenVersion,
      student: updatedStudent,
    };
  }
}
