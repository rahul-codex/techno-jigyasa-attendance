import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/apiResponse.util';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0]?.message || 'Validation failed';
        return ApiResponse.error(res, firstError, 400, {
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return ApiResponse.error(res, 'Invalid request data', 400);
    }
  };
};
