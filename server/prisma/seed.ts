import prisma from '../src/config/db';
import { hashPassword } from '../src/utils/hash.util';
import { env } from '../src/config/env';

/**
 * Seed initial Super Admin and required admin accounts safely.
 * Security Rules:
 * - Reads credentials strictly from backend-only environment variables.
 * - Never prints or logs the plaintext password.
 * - Preserves existing admin accounts and passwords (never overwrites).
 * - Hashes password using bcrypt with cost factor 12.
 */
export async function seedAdminAccounts() {
  const initialAdminId = env.INITIAL_ADMIN_ID?.trim();
  const initialPassword = env.INITIAL_ADMIN_PASSWORD;

  if (!initialAdminId || !initialPassword) {
    console.log('[Seed] Notice: INITIAL_ADMIN_ID or INITIAL_ADMIN_PASSWORD is not set in backend environment.');
    return { created: false, reason: 'MISSING_ENV_CREDENTIALS' };
  }

  // 1. Check if Super Admin already exists
  const existingSuperAdmin = await prisma.admin.findUnique({
    where: { adminId: initialAdminId },
  });

  if (existingSuperAdmin) {
    console.log(`[Seed] Super Admin account (${initialAdminId}) already exists. Credentials preserved.`);
    return { created: false, reason: 'ALREADY_EXISTS', adminId: initialAdminId };
  }

  // 2. Hash password securely using bcrypt (cost factor 12)
  const passwordHash = await hashPassword(initialPassword);

  // 3. Create Super Admin in database
  const createdAdmin = await prisma.admin.create({
    data: {
      adminId: initialAdminId,
      name: 'Super Administrator',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      adminId: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  console.log(`[Seed] Super Admin account (${initialAdminId}) initialized successfully.`);
  return { created: true, admin: createdAdmin };
}

async function main() {
  try {
    await seedAdminAccounts();
  } catch (error) {
    console.error('[Seed Error] Failed to seed admin accounts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
