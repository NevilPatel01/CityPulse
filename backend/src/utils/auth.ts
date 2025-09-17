import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Response } from 'express';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-will-change-in-production'; // Consistent with .env
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};

// JWT Token utilities
export interface TokenPayload {
    userId: number;
    email: string;
    username: string;
    role: string;
}

// Generate Access, Refresh and verify Tokens utilities
export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'citypulse-api',
        audience: 'citypulse-client'
    } as SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'citypulse-api',
        audience: 'citypulse-client'
    } as SignOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'citypulse-api',
            audience: 'citypulse-client'
        });
        return decoded as TokenPayload;
    } catch (error) {
        return null;
    }
};

// Cookie utilities for secure token storage
export const setTokenCookies = (res: Response, accessToken: string, refreshToken: string): void => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Set access token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/'
    });

    // Set refresh token cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth'
    });
};

export const clearTokenCookies = (res: Response): void => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth' });
};

// Custom Password strength validation logic, using regex patterns for appropriate checks
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
