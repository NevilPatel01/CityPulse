import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

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
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                fullName,
                bio: bio || null,
                currentLocation: currentLocation || null,
                hometown: hometown || null,
                phone: phone || null,
                isGoogleUser: false,
                role: 'user',
                accountStatus: 'active',
                emailVerified: false // In production, this would require email verification and google OAuth integration as well
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                bio: true,
                currentLocation: true,
                hometown: true,
                phone: true,
                role: true,
                accountStatus: true,
                emailVerified: true,
                createdAt: true
            }
        });

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
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isValidPassword = await comparePassword(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check account status
        if (user.accountStatus !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended or deactivated'
            });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

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
            fullName: user.fullName,
            bio: user.bio,
            currentLocation: user.currentLocation,
            hometown: user.hometown,
            phone: user.phone,
            role: user.role,
            accountStatus: user.accountStatus,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
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
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user || user.accountStatus !== 'active') {
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

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                bio: true,
                currentLocation: true,
                hometown: true,
                phone: true,
                role: true,
                accountStatus: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLogin: true
            }
        });

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
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user || !user.passwordHash) {
            return res.status(404).json({
                success: false,
                message: 'User not found or invalid account'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                updatedAt: new Date()
            }
        });

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
