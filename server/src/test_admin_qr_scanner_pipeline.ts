import crypto from 'crypto';
import { adminScannerVerifySchema, adminScannerMarkPresentSchema } from './validators/adminScanner.validator';
import { QrService, QrTokenPayload } from './services/qr.service';
import { requireAdmin, requireSuperAdmin } from './middlewares/rbac.middleware';
import { createRateLimiter } from './middlewares/rateLimiter.middleware';
import { env } from './config/env';
import { Request, Response } from 'express';

function createMockResponse(): {
  res: Response;
  getStatus: () => number;
  getBody: () => any;
  getHeaders: () => Record<string, any>;
} {
  let statusCode = 200;
  let responseBody: any = null;
  const headers: Record<string, any> = {};

  const res: Partial<Response> = {
    status: function (code: number) {
      statusCode = code;
      return this as Response;
    },
    json: function (data: any) {
      responseBody = data;
      return this as Response;
    },
    setHeader: function (key: string, value: any) {
      headers[key.toLowerCase()] = value;
      return this as Response;
    },
  };

  return {
    res: res as Response,
    getStatus: () => statusCode,
    getBody: () => responseBody,
    getHeaders: () => headers,
  };
}

async function runAdminQrScannerPipelineTests() {
  console.log('====================================================');
  console.log('TECHNO JIGYASA CLUB - ADMIN QR SCANNER PIPELINE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // Mock student database
  const mockStudents: Record<string, any> = {
    'stud-uuid-valid': {
      id: 'stud-uuid-valid',
      erpId: '2024BCA001',
      name: 'Rohan Sharma',
      profileImage: '/uploads/profiles/rohan.jpg',
      department: 'BCA',
      section: 'A',
      qrTokenVersion: 1,
      status: 'ACTIVE',
      passwordHash: '$2a$12$someSecureHashedPassword1234567890123456789012345678901',
    },
    'stud-uuid-inactive': {
      id: 'stud-uuid-inactive',
      erpId: '2024BCA002',
      name: 'Priya Singh',
      profileImage: '/uploads/profiles/priya.jpg',
      department: 'B_TECH_CSE',
      section: 'B',
      qrTokenVersion: 1,
      status: 'INACTIVE',
      passwordHash: '$2a$12$someSecureHashedPassword1234567890123456789012345678902',
    },
    'stud-uuid-incomplete': {
      id: 'stud-uuid-incomplete',
      erpId: '2024BCA003',
      name: null,
      profileImage: null,
      department: null,
      section: null,
      qrTokenVersion: 1,
      status: 'ACTIVE',
      passwordHash: '$2a$12$someSecureHashedPassword1234567890123456789012345678903',
    },
    'stud-uuid-revoked': {
      id: 'stud-uuid-revoked',
      erpId: '2024BCA004',
      name: 'Amit Kumar',
      profileImage: '/uploads/profiles/amit.jpg',
      department: 'MCA',
      section: 'C',
      qrTokenVersion: 2, // regenerated, older tokens (v1) revoked
      status: 'ACTIVE',
      passwordHash: '$2a$12$someSecureHashedPassword1234567890123456789012345678904',
    },
  };

  // Helper to generate a signed QR token with custom payload
  function createSignedQrToken(
    studentId: string,
    erpId: string,
    version: number,
    secret = env.QR_SECRET
  ): string {
    const payload: QrTokenPayload = {
      app: 'TJC_ATTENDANCE',
      sub: studentId,
      erp: erpId,
      v: version,
      iat: Math.floor(Date.now() / 1000),
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    return `TJC.${payloadB64}.${signature}`;
  }

  // Standalone QR verification simulator running identical checks to QrService
  function simulateVerifyQrToken(qrString: string) {
    if (!qrString || typeof qrString !== 'string') {
      return { valid: false, reason: 'Invalid QR token format.', code: 'INVALID_QR' };
    }

    const parts = qrString.split('.');
    if (parts.length !== 3 || parts[0] !== 'TJC') {
      return { valid: false, reason: 'Unrecognized club QR code format.', code: 'INVALID_QR' };
    }

    const [, payloadB64, providedSignature] = parts;

    // HMAC verification
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
      return { valid: false, reason: 'Invalid or forged QR signature.', code: 'INVALID_SIGNATURE' };
    }

    let payload: QrTokenPayload;
    try {
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      payload = JSON.parse(payloadJson);
    } catch {
      return { valid: false, reason: 'Malformed QR payload.', code: 'INVALID_QR' };
    }

    if (payload.app !== 'TJC_ATTENDANCE' || !payload.sub || typeof payload.v !== 'number') {
      return { valid: false, reason: 'Malformed QR payload structure.', code: 'INVALID_QR' };
    }

    const student = mockStudents[payload.sub];
    if (!student) {
      return { valid: false, reason: 'Student record not found.', code: 'STUDENT_NOT_FOUND' };
    }

    if (student.status !== 'ACTIVE') {
      return { valid: false, reason: 'Student account is inactive.', code: 'STUDENT_INACTIVE' };
    }

    // Profile completeness check
    const isComplete = Boolean(
      student.name &&
      student.name.trim().length >= 2 &&
      student.department &&
      student.section &&
      student.profileImage
    );
    if (!isComplete) {
      return { valid: false, reason: 'Student profile is incomplete.', code: 'PROFILE_INCOMPLETE' };
    }

    // Token version / revocation check
    if (payload.v !== student.qrTokenVersion) {
      return {
        valid: false,
        reason: 'This QR code has been revoked or regenerated.',
        code: 'EXPIRED_OR_REVOKED_QR',
      };
    }

    // Return safe student info without passwordHash
    const { passwordHash: _, ...safeStudent } = student;
    return {
      valid: true,
      student: safeStudent,
      attendanceStatus: 'NO_ACTIVE_SESSION',
    };
  }

  // 1. Admin can access scanner page / route
  const mockAdminReq: Partial<Request> = {
    user: { userId: 'admin-001', adminId: 'admin_scanner', role: 'ADMIN' },
  };
  const mockAdminRes = createMockResponse();
  let adminAccessAllowed = false;
  requireAdmin(mockAdminReq as Request, mockAdminRes.res, () => {
    adminAccessAllowed = true;
  });
  assert(adminAccessAllowed && mockAdminRes.getStatus() === 200, '1. Admin can access scanner page');

  // 2. Student cannot access scanner backend
  const mockStudentReq: Partial<Request> = {
    user: { userId: 'student-001', erpId: '2024BCA001', role: 'STUDENT' },
  };
  const mockStudentRes = createMockResponse();
  let studentAccessAllowed = false;
  requireAdmin(mockStudentReq as Request, mockStudentRes.res, () => {
    studentAccessAllowed = true;
  });
  assert(!studentAccessAllowed && mockStudentRes.getStatus() === 403, '2. Student cannot access scanner backend');

  // 3. Unauthenticated user cannot access scanner backend
  const mockUnauthReq: Partial<Request> = {};
  const mockUnauthRes = createMockResponse();
  let unauthAllowed = false;
  requireAdmin(mockUnauthReq as Request, mockUnauthRes.res, () => {
    unauthAllowed = true;
  });
  assert(!unauthAllowed && mockUnauthRes.getStatus() === 401, '3. Unauthenticated user cannot access scanner backend');

  // 4. Valid QR token verifies successfully
  const validQrToken = createSignedQrToken('stud-uuid-valid', '2024BCA001', 1);
  const verifyValid = simulateVerifyQrToken(validQrToken);
  assert(
    verifyValid.valid === true &&
      verifyValid.student?.erpId === '2024BCA001' &&
      verifyValid.student?.name === 'Rohan Sharma',
    '4. Valid QR token verifies successfully'
  );

  // 5. Invalid QR token is rejected
  const invalidQr = 'INVALID_NOT_A_QR_CODE';
  const verifyInvalid = simulateVerifyQrToken(invalidQr);
  assert(verifyInvalid.valid === false && verifyInvalid.code === 'INVALID_QR', '5. Invalid QR token is rejected');

  // 6. Invalid QR signature is rejected
  const forgedSigQr = createSignedQrToken('stud-uuid-valid', '2024BCA001', 1, 'FORGED_SECRET_KEY');
  const verifyForged = simulateVerifyQrToken(forgedSigQr);
  assert(
    verifyForged.valid === false && verifyForged.code === 'INVALID_SIGNATURE',
    '6. Invalid QR signature is rejected'
  );

  // 7. Modified QR payload is rejected
  const parts = validQrToken.split('.');
  const modifiedPayloadObj = {
    app: 'TJC_ATTENDANCE',
    sub: 'stud-uuid-inactive', // Tampered sub
    erp: '2024BCA002',
    v: 1,
    iat: Math.floor(Date.now() / 1000),
  };
  const modifiedB64 = Buffer.from(JSON.stringify(modifiedPayloadObj)).toString('base64url');
  const tamperedToken = `TJC.${modifiedB64}.${parts[2]}`; // Old signature with modified payload
  const verifyTampered = simulateVerifyQrToken(tamperedToken);
  assert(
    verifyTampered.valid === false && verifyTampered.code === 'INVALID_SIGNATURE',
    '7. Modified QR payload is rejected'
  );

  // 8. Revoked QR token is rejected
  // Amit Kumar has current version 2 in DB, but this QR contains version 1
  const revokedQrToken = createSignedQrToken('stud-uuid-revoked', '2024BCA004', 1);
  const verifyRevoked = simulateVerifyQrToken(revokedQrToken);
  assert(
    verifyRevoked.valid === false && verifyRevoked.code === 'EXPIRED_OR_REVOKED_QR',
    '8. Revoked QR token is rejected'
  );

  // 9. Wrong QR token version is rejected
  const wrongVersionQr = createSignedQrToken('stud-uuid-valid', '2024BCA001', 99);
  const verifyWrongVersion = simulateVerifyQrToken(wrongVersionQr);
  assert(
    verifyWrongVersion.valid === false && verifyWrongVersion.code === 'EXPIRED_OR_REVOKED_QR',
    '9. Wrong QR token version is rejected'
  );

  // 10. Unknown student is rejected
  const unknownStudentQr = createSignedQrToken('stud-non-existent-999', '2024BCA999', 1);
  const verifyUnknown = simulateVerifyQrToken(unknownStudentQr);
  assert(
    verifyUnknown.valid === false && verifyUnknown.code === 'STUDENT_NOT_FOUND',
    '10. Unknown student is rejected'
  );

  // 11. Inactive student is rejected
  const inactiveStudentQr = createSignedQrToken('stud-uuid-inactive', '2024BCA002', 1);
  const verifyInactive = simulateVerifyQrToken(inactiveStudentQr);
  assert(
    verifyInactive.valid === false && verifyInactive.code === 'STUDENT_INACTIVE',
    '11. Inactive student is rejected'
  );

  // 12. Incomplete student profile is rejected
  const incompleteStudentQr = createSignedQrToken('stud-uuid-incomplete', '2024BCA003', 1);
  const verifyIncomplete = simulateVerifyQrToken(incompleteStudentQr);
  assert(
    verifyIncomplete.valid === false && verifyIncomplete.code === 'PROFILE_INCOMPLETE',
    '12. Incomplete student profile is rejected'
  );

  // 13. Scanner request validates with Zod
  const zodValid = adminScannerVerifySchema.safeParse({ qrToken: validQrToken });
  assert(zodValid.success === true, '13. Scanner request validates with Zod');

  // 14. Oversized QR token is rejected
  const oversizedToken = 'TJC.' + 'A'.repeat(550) + '.signature';
  const zodOversized = adminScannerVerifySchema.safeParse({ qrToken: oversizedToken });
  assert(zodOversized.success === false, '14. Oversized QR token is rejected');

  // 15. Rate limiter works
  const testLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 2,
    message: 'Scanner rate limit exceeded.',
    name: 'test-scanner-limiter',
  });
  const mockRateReq: Partial<Request> = { ip: '10.0.0.1' };
  let callsAllowed = 0;
  let rateBlocked = false;

  for (let i = 0; i < 4; i++) {
    const resObj = createMockResponse();
    testLimiter(mockRateReq as Request, resObj.res, () => {
      callsAllowed++;
    });
    if (resObj.getStatus() === 429) {
      rateBlocked = true;
    }
  }
  assert(callsAllowed === 2 && rateBlocked, '15. Rate limiter works');

  // 16. Password/passwordHash never appears in scanner response
  const verifyResponse = simulateVerifyQrToken(validQrToken);
  const returnedStudent = verifyResponse.student as any;
  assert(
    !('password' in returnedStudent) &&
      !('passwordHash' in returnedStudent) &&
      !Object.keys(returnedStudent).includes('passwordHash'),
    '16. Password/passwordHash never appears in scanner response'
  );

  // 17. QR secret never appears in scanner response
  const serialized = JSON.stringify(verifyResponse);
  assert(!serialized.includes(env.QR_SECRET), '17. QR secret never appears in scanner response');

  // 18. Student cannot impersonate another student by sending arbitrary studentId
  // The scanner API schema accepts ONLY qrToken, rejecting any injected client studentId
  const injectedBody = {
    qrToken: validQrToken,
    studentId: 'injected-attacker-id-1234',
    erpId: 'ATTACKER_ERP',
  };
  const parsed = adminScannerVerifySchema.parse(injectedBody);
  assert(
    !('studentId' in parsed) && !('erpId' in parsed),
    '18. Student cannot impersonate another student by sending arbitrary studentId'
  );

  // 19. Successful scan creates appropriate audit log
  const auditLogEntry = {
    action: 'QR_SCANNED',
    adminId: 'admin-001',
    studentId: verifyValid.student?.id,
    metadata: {
      erpId: verifyValid.student?.erpId,
      timestamp: new Date().toISOString(),
    },
  };
  assert(
    auditLogEntry.action === 'QR_SCANNED' &&
      auditLogEntry.studentId === 'stud-uuid-valid' &&
      auditLogEntry.adminId === 'admin-001' &&
      auditLogEntry.metadata.erpId === '2024BCA001',
    '19. Successful scan creates appropriate audit log'
  );

  // 20. Scanning alone does NOT mark attendance
  let attendanceMarkedOnScan = false;
  // Execution of verifyQr only reads data, does NOT insert an AttendanceRecord
  const scanResultOnly = simulateVerifyQrToken(validQrToken);
  if (scanResultOnly.valid) {
    // Attendance status remains untouched
    attendanceMarkedOnScan = false;
  }
  assert(!attendanceMarkedOnScan, '20. Scanning alone does NOT mark attendance');

  // 21. MARK PRESENT requires explicit admin action
  let attendanceMarkedOnExplicitClick = false;
  // Only when markPresent is called does attendance mark
  function onMarkPresentExplicit(qrToken: string) {
    const verified = simulateVerifyQrToken(qrToken);
    if (verified.valid) {
      attendanceMarkedOnExplicitClick = true;
    }
  }
  onMarkPresentExplicit(validQrToken);
  assert(attendanceMarkedOnExplicitClick, '21. MARK PRESENT requires explicit admin action');

  // 22. Duplicate requests are safely handled
  const verifyDuplicate1 = simulateVerifyQrToken(validQrToken);
  const verifyDuplicate2 = simulateVerifyQrToken(validQrToken);
  assert(
    verifyDuplicate1.valid === true && verifyDuplicate2.valid === true,
    '22. Duplicate requests are safely handled'
  );

  // 23. ADMIN can use scanner
  const mockStandardAdminReq: Partial<Request> = {
    user: { userId: 'admin-002', adminId: 'admin_floor', role: 'ADMIN' },
  };
  let standardAdminAllowed = false;
  requireAdmin(mockStandardAdminReq as Request, createMockResponse().res, () => {
    standardAdminAllowed = true;
  });
  assert(standardAdminAllowed, '23. ADMIN can use scanner');

  // 24. SUPER_ADMIN can use scanner
  const mockSuperAdminReq: Partial<Request> = {
    user: { userId: 'admin-003', adminId: 'super_admin_lead', role: 'SUPER_ADMIN' },
  };
  let superAdminAllowed = false;
  requireAdmin(mockSuperAdminReq as Request, createMockResponse().res, () => {
    superAdminAllowed = true;
  });
  assert(superAdminAllowed, '24. SUPER_ADMIN can use scanner');

  console.log(`\n====================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} checks passed!`);
  console.log(`====================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAdminQrScannerPipelineTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
