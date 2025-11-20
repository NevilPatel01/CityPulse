import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to check if user has moderator role
 * Must be used after auth middleware
 */
export const requireModerator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (authReq.user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      error: 'Moderator access required'
    });
  }

  next();
};
