import { z } from 'zod';

export const adminScannerVerifySchema = z.object({
  qrToken: z
    .string({ required_error: 'QR token is required.' })
    .trim()
    .min(10, 'QR token is too short or malformed.')
    .max(500, 'QR token exceeds maximum allowed size.')
    .regex(/^TJC\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'Invalid QR token format.'),
});

export const adminScannerMarkPresentSchema = z.object({
  qrToken: z
    .string({ required_error: 'QR token is required.' })
    .trim()
    .min(10, 'QR token is too short or malformed.')
    .max(500, 'QR token exceeds maximum allowed size.')
    .regex(/^TJC\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'Invalid QR token format.'),
});

export type AdminScannerVerifyInput = z.infer<typeof adminScannerVerifySchema>;
export type AdminScannerMarkPresentInput = z.infer<typeof adminScannerMarkPresentSchema>;
