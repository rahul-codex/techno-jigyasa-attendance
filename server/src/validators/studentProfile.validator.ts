import { z } from 'zod';
import { Department, Section } from '@prisma/client';

export const studentProfileUpdateSchema = z.object({
  name: z
    .string({ required_error: 'Full name is required.' })
    .trim()
    .min(2, { message: 'Full name must contain at least 2 characters.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' })
    .regex(/^[A-Za-z\s.'-]+$/, {
      message: 'Full name can only contain letters, spaces, dots, and hyphens.',
    }),
  department: z.nativeEnum(Department, {
    errorMap: () => ({ message: 'Please select a valid department.' }),
  }),
  section: z.nativeEnum(Section, {
    errorMap: () => ({ message: 'Please select a valid section (A, B, C, or D).' }),
  }),
});

export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;
