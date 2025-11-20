import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has moderator role
 * Must be used after auth middleware
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

  if (req.user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      error: 'Moderator access required'
    });
  }

  next();
};
