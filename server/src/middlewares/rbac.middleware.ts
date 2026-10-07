import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.util';
import { UserRole } from '../types/auth.types';

export const requireRoles = (allowedRoles: UserRole[], customForbiddenMessage?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        customForbiddenMessage || 'Access denied. You do not have permission to access this resource.',
        403
      );
    }

    next();
  };
};

export const requireStudent = requireRoles(['STUDENT']);
export const requireAdmin = requireRoles(['ADMIN', 'SUPER_ADMIN']);
export const requireSuperAdmin = requireRoles(
  ['SUPER_ADMIN'],
  'Access denied. Super Admin privileges required.'
);
