import { studentProfileUpdateSchema } from './validators/studentProfile.validator';
import { StudentProfileService } from './services/studentProfile.service';
import { verifyImageMagicBytes, getUploadsDir } from './utils/file.util';
import { requireStudent } from './middlewares/rbac.middleware';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

async function runProfilePipelineTests() {
  console.log('====================================================');
  console.log('TECHNO JIGYASA CLUB - PROFILE PIPELINE & SECURITY VERIFICATION');
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

  // 1. Profile completeness check on incomplete student (newly registered)
  const incompleteStudent1 = {
    id: 'uuid-1',
    erpId: '2024BCA001',
    name: null,
    profileImage: null,
    department: null,
    section: null,
  };
  assert(
    StudentProfileService.isComplete(incompleteStudent1 as any) === false,
    '1. Newly registered student with null fields detected as incomplete'
  );

  // 2. Profile completeness check with missing photo
  const incompleteStudent2 = {
    id: 'uuid-1',
    erpId: '2024BCA001',
    name: 'Aarav Sharma',
    profileImage: null,
    department: 'BCA' as const,
    section: 'A' as const,
  };
  assert(
    StudentProfileService.isComplete(incompleteStudent2 as any) === false,
    '2. Student missing profile photo detected as incomplete'
  );

  // 3. Profile completeness check with all fields present
  const completeStudent = {
    id: 'uuid-1',
    erpId: '2024BCA001',
    name: 'Aarav Sharma',
    profileImage: '/uploads/profiles/profile-12345.webp',
    department: 'BCA' as const,
    section: 'A' as const,
  };
  assert(
    StudentProfileService.isComplete(completeStudent as any) === true,
    '3. Student with name, department, section, and photo detected as complete'
  );

  // 4. Valid profile update schema validation
  try {
    const valid = studentProfileUpdateSchema.parse({
      name: 'Priya Verma',
      department: 'B_TECH_AIML',
      section: 'B',
    });
    assert(
      valid.name === 'Priya Verma' && valid.department === 'B_TECH_AIML' && valid.section === 'B',
      '4. Valid profile details accepted by validator'
    );
  } catch (error) {
    assert(false, '4. Valid profile details should pass');
  }

  // 5. Invalid department rejected
  try {
    studentProfileUpdateSchema.parse({
      name: 'Rohan Gupta',
      department: 'MECHANICAL_ENGINEERING' as any,
      section: 'A',
    });
    assert(false, '5. Invalid department should be rejected');
  } catch (error: any) {
    assert(
      error.errors?.[0]?.message === 'Please select a valid department.',
      '5. Invalid department rejected by schema validator'
    );
  }

  // 6. Invalid section rejected
  try {
    studentProfileUpdateSchema.parse({
      name: 'Rohan Gupta',
      department: 'B_TECH_CSE',
      section: 'Z' as any,
    });
    assert(false, '6. Invalid section should be rejected');
  } catch (error: any) {
    assert(
      error.errors?.[0]?.message === 'Please select a valid section (A, B, C, or D).',
      '6. Invalid section rejected by schema validator'
    );
  }

  // 7. Short name rejected (< 2 characters)
  try {
    studentProfileUpdateSchema.parse({
      name: 'A',
      department: 'BCA',
      section: 'A',
    });
    assert(false, '7. Single-character name should be rejected');
  } catch (error: any) {
    assert(
      error.errors?.[0]?.message === 'Full name must contain at least 2 characters.',
      '7. Short name rejected (< 2 chars)'
    );
  }

  // 8. Name with invalid characters rejected
  try {
    studentProfileUpdateSchema.parse({
      name: 'Hacker123 <script>',
      department: 'BCA',
      section: 'A',
    });
    assert(false, '8. Name with script/numbers should be rejected');
  } catch (error: any) {
    assert(
      error.errors?.[0]?.message.includes('can only contain letters'),
      '8. Name with numbers and script tags rejected'
    );
  }

  // 9. ERP ID cannot be altered through profile update schema
  const parsedData = studentProfileUpdateSchema.parse({
    name: 'Vikram Singh',
    department: 'MCA',
    section: 'C',
    erpId: 'MODIFIED_ERP_ATTEMPT', // Malicious attempt to change ERP ID
    passwordHash: 'HACKED_HASH', // Malicious attempt to change password
  } as any);
  assert(!('erpId' in parsedData), '9. Extra fields (erpId) stripped by Zod allowlist');
  assert(!('passwordHash' in parsedData), '10. Sensitive fields (passwordHash) stripped by Zod allowlist');

  // 11. Image Magic Bytes: Valid JPEG verification
  const tempDir = getUploadsDir();
  const testJpegPath = path.join(tempDir, 'test_magic_byte.jpg');
  // JPEG Header: FF D8 FF E0 00 10 4A 46 49 46 00 01
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  fs.writeFileSync(testJpegPath, jpegHeader);
  assert(verifyImageMagicBytes(testJpegPath) === true, '11. Valid JPEG file magic bytes verified');
  fs.unlinkSync(testJpegPath);

  // 12. Image Magic Bytes: Valid PNG verification
  const testPngPath = path.join(tempDir, 'test_magic_byte.png');
  // PNG Header: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  fs.writeFileSync(testPngPath, pngHeader);
  assert(verifyImageMagicBytes(testPngPath) === true, '12. Valid PNG file magic bytes verified');
  fs.unlinkSync(testPngPath);

  // 13. Image Magic Bytes: Fake image (malicious executable or text spoofed with .jpg)
  const testFakePath = path.join(tempDir, 'fake_malware.jpg');
  const fakeContent = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00'); // Windows PE executable header
  fs.writeFileSync(testFakePath, fakeContent);
  assert(verifyImageMagicBytes(testFakePath) === false, '13. Spoofed file with executable content rejected by magic bytes');
  fs.unlinkSync(testFakePath);

  // 14. RBAC: Role-based isolation for student profile
  let studentAccessGranted = false;
  const studentReq: Partial<Request> = {
    user: { userId: 'uuid-101', erpId: '2024BCA001', role: 'STUDENT' },
  };
  const mockRes: Partial<Response> = {
    status: function (code: number) {
      (this as any).statusCode = code;
      return this as Response;
    },
    json: function (data: any) {
      (this as any).body = data;
      return this as Response;
    },
  };

  requireStudent(studentReq as Request, mockRes as Response, () => {
    studentAccessGranted = true;
  });
  assert(Boolean(studentAccessGranted), '14. requireStudent allows verified STUDENT role');

  // 15. RBAC: Non-student access blocked from student endpoints
  let nonStudentAccessGranted = false;
  const adminReq: Partial<Request> = {
    user: { userId: 'admin-1', erpId: 'admin_jigyasa', role: 'ADMIN' },
  };
  requireStudent(adminReq as Request, mockRes as Response, () => {
    nonStudentAccessGranted = true;
  });
  assert(!nonStudentAccessGranted, '15. Non-student / ADMIN role blocked from student profile endpoints');

  console.log(`\n====================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} checks passed!`);
  console.log(`====================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runProfilePipelineTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
