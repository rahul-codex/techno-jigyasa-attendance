-- CreateEnum
CREATE TYPE "Department" AS ENUM ('BCA', 'B_TECH_AIML', 'B_TECH_CSE', 'B_TECH_EN', 'MCA');

-- CreateEnum
CREATE TYPE "Section" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('SESSION_1', 'SESSION_2');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "erpId" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "profileImage" TEXT,
    "department" "Department",
    "section" "Section",
    "qrTokenVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "studentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_adminId_key" ON "admins"("adminId");

-- CreateIndex
CREATE INDEX "admins_adminId_idx" ON "admins"("adminId");

-- CreateIndex
CREATE INDEX "admins_role_idx" ON "admins"("role");

-- CreateIndex
CREATE INDEX "admins_status_idx" ON "admins"("status");

-- CreateIndex
CREATE UNIQUE INDEX "students_erpId_key" ON "students"("erpId");

-- CreateIndex
CREATE INDEX "students_erpId_idx" ON "students"("erpId");

-- CreateIndex
CREATE INDEX "students_department_idx" ON "students"("department");

-- CreateIndex
CREATE INDEX "students_section_idx" ON "students"("section");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "students_qrTokenVersion_idx" ON "students"("qrTokenVersion");

-- CreateIndex
CREATE INDEX "attendance_sessions_date_idx" ON "attendance_sessions"("date");

-- CreateIndex
CREATE INDEX "attendance_sessions_sessionType_idx" ON "attendance_sessions"("sessionType");

-- CreateIndex
CREATE INDEX "attendance_sessions_status_idx" ON "attendance_sessions"("status");

-- CreateIndex
CREATE INDEX "attendance_sessions_createdByAdminId_idx" ON "attendance_sessions"("createdByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_date_sessionType_key" ON "attendance_sessions"("date", "sessionType");

-- CreateIndex
CREATE INDEX "attendance_records_studentId_idx" ON "attendance_records"("studentId");

-- CreateIndex
CREATE INDEX "attendance_records_sessionId_idx" ON "attendance_records"("sessionId");

-- CreateIndex
CREATE INDEX "attendance_records_attendanceDate_idx" ON "attendance_records"("attendanceDate");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

-- CreateIndex
CREATE INDEX "attendance_records_markedByAdminId_idx" ON "attendance_records"("markedByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_sessionId_key" ON "attendance_records"("studentId", "sessionId");

-- CreateIndex
CREATE INDEX "activity_logs_adminId_idx" ON "activity_logs"("adminId");

-- CreateIndex
CREATE INDEX "activity_logs_studentId_idx" ON "activity_logs"("studentId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_markedByAdminId_fkey" FOREIGN KEY ("markedByAdminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
