import { z } from 'zod';

export const studentRegisterSchema = z
  .object({
    erpId: z
      .string({ required_error: 'ERP ID is required' })
      .trim()
      .min(3, { message: 'ERP ID must be at least 3 characters' })
      .max(50, { message: 'ERP ID cannot exceed 50 characters' }),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, { message: 'Password must contain at least 8 characters.' })
      .max(100, { message: 'Password cannot exceed 100 characters' }),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(1, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const studentLoginSchema = z.object({
  erpId: z
    .string({ required_error: 'ERP ID is required' })
    .trim()
    .min(1, { message: 'ERP ID is required' })
    .max(50, { message: 'ERP ID cannot exceed 50 characters' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' }),
});

export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
