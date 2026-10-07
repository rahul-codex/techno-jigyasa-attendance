import { studentRegisterSchema, studentLoginSchema } from './validators/studentAuth.validator';
import { hashPassword, comparePassword } from './utils/hash.util';
import { signToken, verifyToken } from './utils/token.util';
import { requireStudent, requireAdmin } from './middlewares/rbac.middleware';
import { Request, Response } from 'express';

async function runAuthPipelineTests() {
  console.log('====================================================');
  console.log('TECHNO JIGYASA CLUB - AUTHENTICATION SECURITY & PIPELINE VERIFICATION');
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

  // 1. Password mismatch validation
  try {
    studentRegisterSchema.parse({
      erpId: '2024BCA001',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    assert(false, '1. Password mismatch should fail validation');
  } catch (error: any) {
    assert(
      error.errors?.[0]?.message === 'Passwords do not match.',
      '1. Register with mismatched passwords caught cleanly'
    );
  }

  // 2. Short password validation (< 8 chars)
  try {
    studentRegisterSchema.parse({
      erpId: '2024BCA001',
      password: 'short',
      confirmPassword: 'short',
    });
    assert(false, '2. Short password should fail validation');
  } catch (error: any) {
    assert(
      error.errors?.[0]?.message === 'Password must contain at least 8 characters.',
      '2. Register with short password (< 8 chars) rejected'
    );
  }

  // 3. Valid registration input validation & ERP ID trimming
  try {
    const valid = studentRegisterSchema.parse({
      erpId: '   2024BCA001   ',
      password: 'StrongPassword123',
      confirmPassword: 'StrongPassword123',
    });
    assert(valid.erpId === '2024BCA001', '3. ERP ID properly trimmed and registration input valid');
  } catch (error: any) {
    assert(false, '3. Valid registration input should pass');
  }

  // 4. Login validation
  try {
    studentLoginSchema.parse({ erpId: '2024BCA001', password: 'StrongPassword123' });
    assert(true, '4. Valid login schema parsed successfully');
  } catch (error) {
    assert(false, '4. Valid login schema should pass');
  }

  // 5. Empty ERP ID or password rejected
  try {
    studentLoginSchema.parse({ erpId: '', password: '' });
    assert(false, '5. Empty credentials should fail');
  } catch (error) {
    assert(true, '5. Empty ERP ID / password rejected by validator');
  }

  // 6. Bcrypt password hashing & comparison
  const rawPassword = 'StudentSecretPassword2026';
  const hashed = await hashPassword(rawPassword);
  assert(hashed.startsWith('$2'), '6. Bcrypt hash generated with secure algorithm');
  assert(hashed !== rawPassword, '7. Plaintext password is never stored or identical to hash');

  const match = await comparePassword(rawPassword, hashed);
  assert(match === true, '8. Correct password verifies against bcrypt hash');

  const wrongMatch = await comparePassword('WrongPassword', hashed);
  assert(wrongMatch === false, '9. Incorrect password fails bcrypt verification');

  // 10. Minimal JWT token creation & payload verification
  const token = signToken({
    userId: 'uuid-student-1234',
    erpId: '2024BCA001',
    role: 'STUDENT',
  });
  assert(typeof token === 'string' && token.length > 20, '10. JWT token generated successfully');

  const decoded = verifyToken(token);
  assert(decoded !== null, '11. JWT token verifies and decodes');
  assert(decoded?.userId === 'uuid-student-1234', '12. JWT contains correct student ID');
  assert(decoded?.role === 'STUDENT', '13. JWT contains STUDENT role');
  assert(decoded?.erpId === '2024BCA001', '14. JWT contains ERP ID');
  assert(!('password' in (decoded as any)), '15. JWT contains NO password');
  assert(!('passwordHash' in (decoded as any)), '16. JWT contains NO passwordHash');

  // 17. RBAC Verification: Student can access Student routes
  let studentAllowed: boolean = false;
  const mockStudentReq: Partial<Request> = {
    user: { userId: 'uuid-1', erpId: '2024BCA001', role: 'STUDENT' },
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

  const nextStudent = () => {
    studentAllowed = true;
  };
  requireStudent(mockStudentReq as Request, mockRes as Response, nextStudent);
  assert(Boolean(studentAllowed), '17. requireStudent permits STUDENT role');

  // 18. RBAC Verification: Student CANNOT access Admin routes
  let adminAllowed = false;
  const nextAdmin = () => {
    adminAllowed = true;
  };
  requireAdmin(mockStudentReq as Request, mockRes as Response, nextAdmin);
  assert(!adminAllowed, '18. requireAdmin BLOCKS student from admin routes (403 Forbidden)');

  console.log(`\n====================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} checks passed!`);
  console.log(`====================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAuthPipelineTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
