import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
import { query } from '../lib/database';

// This extends the Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload & {
                accountStatus: string;
                emailVerified: boolean;
            };
        }
    }
}

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header or cookies
        let token: string | undefined;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Get user from database to check current status
        const userResult = await query(
            'SELECT id, username, email, role, account_status, email_verified FROM users WHERE id = $1',
            [decoded.userId]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if account is active
        if (user.account_status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Add user info to request
        req.user = {
            ...decoded,
            accountStatus: user.account_status,
            emailVerified: user.email_verified
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token: string | undefined;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return next(); // Continue without user
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return next(); // Continue without user
        }

        const userResult = await query(
            'SELECT id, username, email, role, account_status, email_verified FROM users WHERE id = $1',
            [decoded.userId]
        );

        const user = userResult.rows[0];

        if (user && user.account_status === 'active') {
            req.user = {
                ...decoded,
                accountStatus: user.account_status,
                emailVerified: user.email_verified
            };
        }

        next();
    } catch (error) {
        // Continue without user if there's an error
        next();
    }
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Email verification middleware
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (!req.user.emailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required'
        });
    }

    next();
};

// Optional authentication middleware - adds user info if available but doesn't require it
export const optionalAuthenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from Authorization header or cookies
        let token: string | undefined;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (token) {
            try {
                // Verify the token
                const decoded = verifyToken(token);

                // Get user details from database
                const userResult = await query(
                    'SELECT id, username, email, account_status, email_verified FROM users WHERE id = $1',
                    [decoded.userId]
                );

                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    req.user = {
                        ...decoded,
                        accountStatus: user.account_status,
                        emailVerified: user.email_verified
                    };
                }
            } catch (error) {
                // If token is invalid, just continue without user info
                console.log('Optional auth: Invalid token, continuing without user info');
            }
        }

        next();
    } catch (error) {
        // On any error, just continue without authentication
        next();
    }
};
