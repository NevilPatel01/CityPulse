import { Request, Response } from 'express';
import { query } from '../lib/database';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    setTokenCookies,
    clearTokenCookies,
    verifyToken,
    TokenPayload
} from '../utils/auth';

// Google OAuth user interface
interface GoogleOAuthUser {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
}

// User registration
export const register = async (req: Request, res: Response) => {
    try {
        const {
            username,
            email,
            password,
            fullName,
            bio,
            currentLocation,
            hometown,
            phone
        } = req.body;

        // Check if user already exists
        const existingUserResult = await query(
            'SELECT id, email, username FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUserResult.rows.length > 0) {
            const existingUser = existingUserResult.rows[0];
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const userResult = await query(
            `INSERT INTO users (username, email, password_hash, full_name, bio, current_location, hometown, phone, is_google_user, role, account_status, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id, username, email, full_name, bio, current_location, hometown, phone, role, account_status, email_verified, created_at`,
            [
                username,
                email,
                passwordHash,
                fullName,
                bio || null,
                currentLocation || null,
                hometown || null,
                phone || null,
                false, // is_google_user
                'user', // role
                'active', // account_status
                false // email_verified
            ]
        );

        const user = userResult.rows[0];

        // Generate tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// User login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const userResult = await query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        const user = userResult.rows[0];

        if (!user || !user.password_hash) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check account status
        if (user.account_status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended or deactivated'
            });
        }

        // Update last login
        await query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Generate tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Set cookies
        setTokenCookies(res, accessToken, refreshToken);

        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            bio: user.bio,
            currentLocation: user.current_location,
            hometown: user.hometown,
            phone: user.phone,
            role: user.role,
            accountStatus: user.account_status,
            emailVerified: user.email_verified,
            createdAt: user.created_at,
            lastLogin: user.last_login
        };

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// User logout
export const logout = async (req: Request, res: Response) => {
    try {
        // Clear cookies
        clearTokenCookies(res);

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response) => {
    try {
        let token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = verifyToken(token);
        if (!decoded) {
            clearTokenCookies(res);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        // Get current user data
        const userResult = await query(
            'SELECT * FROM users WHERE id = $1',
            [decoded.userId]
        );

        const user = userResult.rows[0];

        if (!user || user.account_status !== 'active') {
            clearTokenCookies(res);
            return res.status(401).json({
                success: false,
                message: 'User not found or account inactive'
            });
        }

        // Generate new tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        const accessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);

        // Set new cookies
        setTokenCookies(res, accessToken, newRefreshToken);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        clearTokenCookies(res);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userResult = await query(
            `SELECT id, username, email, full_name, bio, current_location, hometown, phone, role, account_status, email_verified, created_at, updated_at, last_login 
             FROM users WHERE id = $1`,
            [req.user.userId]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password hash
        const userResult = await query(
            'SELECT * FROM users WHERE id = $1',
            [req.user.userId]
        );

        const user = userResult.rows[0];

        if (!user || !user.password_hash) {
            return res.status(404).json({
                success: false,
                message: 'User not found or invalid account'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newPasswordHash, user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Google OAuth authentication
export const googleOAuth = async (req: Request, res: Response) => {
    try {
        const { googleId, email, name, picture, accessToken }: GoogleOAuthUser = req.body;

        console.log('🔧 Google OAuth request received:', { googleId, email, name, picture: !!picture });

        // Validate required fields
        if (!googleId || !email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Missing required Google OAuth data'
            });
        }

        // Check if user already exists (by email or google ID)
        const existingUserResult = await query(
            'SELECT * FROM users WHERE email = $1 OR google_id = $2',
            [email, googleId]
        );

        let user;

        if (existingUserResult.rows.length > 0) {
            // User exists - update Google info if needed
            user = existingUserResult.rows[0];
            console.log('✅ Existing user found:', user.id);

            // Update Google ID if not set or update last login
            await query(
                `UPDATE users SET 
                    google_id = $1, 
                    is_google_user = true, 
                    last_login = NOW(), 
                    updated_at = NOW()
                WHERE id = $2`,
                [googleId, user.id]
            );

        } else {
            // Create new user
            console.log('🔧 Creating new user from Google OAuth');

            // Extract username from email (before @)
            const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 8);

            const userResult = await query(
                `INSERT INTO users (
                    username, email, full_name, google_id, is_google_user, 
                    role, account_status, email_verified
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, username, email, full_name, google_id, is_google_user, role, account_status, email_verified, created_at`,
                [
                    username,
                    email,
                    name,
                    googleId,
                    true,
                    'user',
                    'active',
                    true // Google users are email verified
                ]
            );

            user = userResult.rows[0];
            console.log('✅ New user created:', user.id);
        }

        // Check account status
        if (user.account_status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended or deactivated'
            });
        }

        // Generate JWT tokens
        const tokenPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            role: user.role
        };

        const jwtAccessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Set cookies
        setTokenCookies(res, jwtAccessToken, refreshToken);

        console.log('✅ Google OAuth authentication successful for user:', user.id);

        res.json({
            success: true,
            message: 'Google OAuth authentication successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    fullName: user.full_name
                },
                accessToken: jwtAccessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('❌ Google OAuth error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during Google OAuth'
        });
    }
};
