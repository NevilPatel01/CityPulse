import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has moderator or admin role
 * Must be used after auth middleware
 * Admins have the same permissions as moderators
 */
export const requireModerator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Allow both moderator and admin roles
  if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Moderator or admin access required'
    });
  }

  next();
};
