import { z } from 'zod';

export const adminLoginSchema = z.object({
  adminId: z
    .string({ required_error: 'Admin ID is required.' })
    .trim()
    .min(1, 'Admin ID is required.')
    .max(50, 'Admin ID cannot exceed 50 characters.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.')
    .max(100, 'Password is too long.'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
