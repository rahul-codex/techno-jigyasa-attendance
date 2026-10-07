import { z } from 'zod';

export const createSessionSchema = z.object({
  sessionType: z.enum(['SESSION_1', 'SESSION_2'], {
    errorMap: () => ({ message: 'Session type must be either SESSION_1 or SESSION_2.' }),
  }),
});

export const attendanceCorrectionSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT'], {
    errorMap: () => ({ message: 'Attendance status must be either PRESENT or ABSENT.' }),
  }),
});

export const attendanceRecordsFilterSchema = z.object({
  department: z.string().optional(),
  section: z.string().optional(),
  status: z.enum(['PRESENT', 'ABSENT']).optional(),
  search: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type AttendanceCorrectionInput = z.infer<typeof attendanceCorrectionSchema>;
export type AttendanceRecordsFilterInput = z.infer<typeof attendanceRecordsFilterSchema>;
