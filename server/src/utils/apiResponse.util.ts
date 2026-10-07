import { Response } from 'express';

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | Record<string, unknown> | null;
}

export class ApiResponse {
  static success<T>(res: Response, message: string, data?: T, statusCode = 200) {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(payload);
  }

  static error(res: Response, message: string, statusCode = 400, error?: string | Record<string, unknown> | null) {
    const payload: ApiResponsePayload = {
      success: false,
      message,
      error: error || null,
    };
    return res.status(statusCode).json(payload);
  }
}
