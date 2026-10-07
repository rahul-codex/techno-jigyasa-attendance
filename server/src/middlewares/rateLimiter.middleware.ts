import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.util';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStores = new Map<string, Map<string, RateLimitRecord>>();

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  name?: string;
}) => {
  const { windowMs, max, message = 'Too many requests, please try again later.', name = 'default' } = options;

  if (!rateLimitStores.has(name)) {
    rateLimitStores.set(name, new Map());
  }
  const store = rateLimitStores.get(name)!;

  return (req: Request, res: Response, next: NextFunction) => {
    // In test or non-production environments with specific header/query, allow if configured
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      return ApiResponse.error(res, message, 429, {
        retryAfter: retryAfterSeconds,
      });
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    next();
  };
};

// Generous rate limiters for development & testing while preventing brute-force attacks
export const studentLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 login attempts per 15 minutes
  message: 'Too many login attempts. Please try again after 15 minutes.',
  name: 'student-login',
});

export const studentRegisterLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 registrations per 15 minutes
  message: 'Too many registration attempts. Please try again later.',
  name: 'student-register',
});

// Strict rate limiter for Admin authentication to prevent brute force attacks
export const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Max 10 attempts per IP per 15 minutes
  message: 'Too many admin login attempts. Please try again after 15 minutes.',
  name: 'admin-login',
});

// Scanner rate limiter for admin QR verification & attendance requests
export const adminScannerLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  max: 120, // Max 120 requests per minute
  message: 'Scanner request limit exceeded. Please wait a moment before scanning again.',
  name: 'admin-scanner',
});
