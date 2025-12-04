import { Request, Response } from 'express';
import crypto from 'crypto';
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
import {
    sendPasswordResetEmail,
    sendPasswordResetSuccessEmail,
    sendVerificationEmail,
    generateSecurityCode,
    generateResetToken
} from '../services/emailService';
import { removeSensitiveFields, sanitizeUserForSelf } from '../utils/responseSanitizer';

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

        // Convert email and username to lowercase
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.toLowerCase().trim();

        // Check if user already exists (case-insensitive check)
        const existingUserResult = await query(
            'SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $2',
            [normalizedEmail, normalizedUsername]
        );

        if (existingUserResult.rows.length > 0) {
            const existingUser = existingUserResult.rows[0];
            const field = existingUser.email === normalizedEmail ? 'email' : 'username';
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
                normalizedUsername,
                normalizedEmail,
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

        // Create user_profiles record with default values
        try {
            await query(
                `INSERT INTO user_profiles (user_id) VALUES ($1)`,
                [user.id]
            );
        } catch (profileError) {
            console.error(`[AUTH] Error creating user_profiles record:`, profileError);
            // Continue with registration even if profile creation fails
        }

        // Generate verification token
        const verificationToken = generateResetToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store verification token
        await query(
            `INSERT INTO email_verification_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, verificationToken, expiresAt]
        );

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken, user.username);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username
                }
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

        // Convert email to lowercase
        const normalizedEmail = email.toLowerCase().trim();

        // Find user - explicitly select fields, excluding password_hash from initial query
        const userResult = await query(
            'SELECT id, username, email, password_hash, full_name, bio, current_location, hometown, phone, role, account_status, email_verified, created_at, updated_at, last_login, deactivated_at, is_google_user FROM users WHERE email = $1',
            [normalizedEmail]
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

        // Check account status and handle reactivation
        if (user.account_status !== 'active') {
            // Check if account is pending_deletion and within 30-day reactivation window
            if (user.account_status === 'pending_deletion' && user.deactivated_at) {
                const deactivatedDate = new Date(user.deactivated_at);
                const daysSinceDeactivation = Math.floor((Date.now() - deactivatedDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceDeactivation <= 30) {
                    // Reactivate the account
                    await query(
                        `UPDATE users 
                         SET account_status = 'active', 
                             deactivated_at = NULL, 
                             updated_at = NOW() 
                         WHERE id = $1`,
                        [user.id]
                    );
                    
                    
                    // Update user object for token generation
                    user.account_status = 'active';
                } else {
                    // Account has been deactivated for more than 30 days
                    return res.status(403).json({
                        success: false,
                        message: 'Your account has been permanently deleted. The 30-day reactivation period has expired. Please register for a new account.',
                        code: 'ACCOUNT_EXPIRED'
                    });
                }
            } else {
                // Account is suspended or banned
                return res.status(403).json({
                    success: false,
                    message: 'Account is suspended or banned. Please contact support.',
                    code: 'ACCOUNT_SUSPENDED'
                });
            }
        }

        // Check email verification - CRITICAL SECURITY REQUIREMENT
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                code: 'EMAIL_NOT_VERIFIED',
                data: {
                    email: user.email,
                    userId: user.id
                }
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

        // Get profile photo from user_profiles
        const profileResult = await query(
            'SELECT profile_photo_url FROM user_profiles WHERE user_id = $1',
            [user.id]
        );
        const profilePhotoUrl = profileResult.rows[0]?.profile_photo_url || null;

        // Sanitize user response - remove password_hash and other sensitive fields
        const userResponse = sanitizeUserForSelf({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            profilePicture: profilePhotoUrl,
            bio: user.bio,
            currentLocation: user.current_location,
            hometown: user.hometown,
            phone: user.phone,
            role: user.role,
            accountStatus: user.account_status,
            emailVerified: user.email_verified,
            createdAt: user.created_at,
            lastLogin: user.last_login
        });

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

        // Get current user data - exclude password_hash
        const userResult = await query(
            'SELECT id, username, email, full_name, bio, current_location, hometown, phone, role, account_status, email_verified, created_at, updated_at, last_login, is_google_user FROM users WHERE id = $1',
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
            `SELECT u.id, u.username, u.email, u.full_name, u.bio, u.current_location, u.hometown, u.phone, u.role, u.account_status, u.email_verified, u.created_at, u.updated_at, u.last_login,
                    up.profile_photo_url
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id
             WHERE u.id = $1`,
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
            data: {
                user: {
                    id: user.id.toString(),
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    profilePicture: user.profile_photo_url || null,
                    bio: user.bio,
                    currentLocation: user.current_location,
                    hometown: user.hometown,
                    phone: user.phone,
                    role: user.role,
                    accountStatus: user.account_status,
                    emailVerified: user.email_verified,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                    lastLogin: user.last_login
                }
            }
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

        // Get user with password hash - needed for password verification
        const userResult = await query(
            'SELECT id, username, email, password_hash, account_status, is_google_user FROM users WHERE id = $1',
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
        const { code, redirectUri, googleId: directGoogleId, email: directEmail, name: directName, picture: directPicture, accessToken } = req.body;


        let googleId: string;
        let email: string;
        let name: string;
        let picture: string | undefined;

        // Support two flows:
        // 1. Authorization code flow (production)
        // 2. Direct user data flow (testing)
        if (code) {
            // PRODUCTION FLOW: Exchange authorization code for access token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri || process.env.FRONTEND_URL + '/auth/google/callback',
                }),
            });

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to exchange authorization code',
                    error: errorText
                });
            }

            const tokenData = await tokenResponse.json() as { access_token: string; token_type: string };

            // Get user info from Google
            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`);

            if (!userInfoResponse.ok) {
                console.error('❌ Failed to get user info');
                return res.status(400).json({
                    success: false,
                    message: 'Failed to get user information from Google'
                });
            }

            const googleUser = await userInfoResponse.json() as { id: string; email: string; name: string; picture?: string };

            googleId = googleUser.id;
            email = googleUser.email;
            name = googleUser.name;
            picture = googleUser.picture;
        } else if (directGoogleId && directEmail && directName) {
            // TEST FLOW: Use provided user data directly
            googleId = directGoogleId;
            email = directEmail;
            name = directName;
            picture = directPicture;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Missing required Google OAuth data'
            });
        }

        // Convert email to lowercase
        const normalizedEmail = email.toLowerCase().trim();

        // Validate user data
        if (!googleId || !normalizedEmail || !name) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user data received from Google'
            });
        }

        // Check if user already exists (by email or google ID) - include password_hash for Google users who might have password
        const existingUserResult = await query(
            'SELECT id, username, email, password_hash, full_name, bio, current_location, hometown, phone, role, account_status, email_verified, created_at, updated_at, last_login, deactivated_at, is_google_user, google_id FROM users WHERE email = $1 OR google_id = $2',
            [normalizedEmail, googleId]
        );

        let user;

        if (existingUserResult.rows.length > 0) {
            // User exists - update Google info if needed
            user = existingUserResult.rows[0];

            // Check if account is deactivated and handle reactivation
            if (user.account_status === 'pending_deletion' && user.deactivated_at) {
                const deactivatedDate = new Date(user.deactivated_at);
                const daysSinceDeactivation = Math.floor((Date.now() - deactivatedDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceDeactivation <= 30) {
                    // Reactivate the account
                    await query(
                        `UPDATE users SET 
                            google_id = $1, 
                            is_google_user = true, 
                            account_status = 'active',
                            deactivated_at = NULL,
                            last_login = NOW(), 
                            updated_at = NOW()
                        WHERE id = $2`,
                        [googleId, user.id]
                    );
                    
                    
                    // Update user object
                    user.account_status = 'active';
                } else {
                    // Account has been deactivated for more than 30 days
                    return res.status(403).json({
                        success: false,
                        message: 'Your account has been permanently deleted. The 30-day reactivation period has expired. Please register for a new account.',
                        code: 'ACCOUNT_EXPIRED'
                    });
                }
            } else {
                // Normal update - no reactivation needed
                await query(
                    `UPDATE users SET 
                        google_id = $1, 
                        is_google_user = true, 
                        last_login = NOW(), 
                        updated_at = NOW()
                    WHERE id = $2`,
                    [googleId, user.id]
                );
            }

        } else {
            // Create new user

            // Extract username from email (before @)
            const username = normalizedEmail.split('@')[0] + '_' + Math.random().toString(36).substring(2, 8);

            const userResult = await query(
                `INSERT INTO users (
                    username, email, full_name, google_id, is_google_user, 
                    role, account_status, email_verified
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, username, email, full_name, google_id, is_google_user, role, account_status, email_verified, created_at`,
                [
                    username,
                    normalizedEmail,
                    name,
                    googleId,
                    true,
                    'user',
                    'active',
                    true // Google users are email verified
                ]
            );

            user = userResult.rows[0];

            // Create user_profiles record for new Google OAuth user
            try {
                await query(
                    `INSERT INTO user_profiles (user_id) VALUES ($1)`,
                    [user.id]
                );
            } catch (profileError) {
                console.error(`[GOOGLE_AUTH] Error creating user_profiles record:`, profileError);
                // Continue with authentication even if profile creation fails
            }
        }

        // Check account status (should be active at this point due to reactivation logic above)
        if (user.account_status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is suspended or banned. Please contact support.',
                code: 'ACCOUNT_SUSPENDED'
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
        console.error('Google OAuth error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during Google OAuth'
        });
    }
};

// Request password reset - sends security code via email
export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Convert email to lowercase
        const normalizedEmail = email.toLowerCase().trim();


        // Check if user exists
        const userResult = await query(
            'SELECT id, email, username, full_name, is_google_user FROM users WHERE email = $1',
            [normalizedEmail]
        );

        // Always return success to prevent email enumeration
        if (userResult.rows.length === 0) {
            return res.json({
                success: true,
                message: 'If an account with this email exists, you will receive a password reset code.'
            });
        }

        const user = userResult.rows[0];

        // Allow Google OAuth users to set backup passwords
        if (user.is_google_user) {
        }

        // Clean up any existing unused reset tokens for this user
        await query(
            'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = FALSE',
            [user.id]
        );

        // Generate security code and reset token
        const securityCode = generateSecurityCode();
        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now


        // Store reset token in database
        await query(
            `INSERT INTO password_reset_tokens 
                (user_id, email, security_code, reset_token, expires_at) 
                VALUES ($1, $2, $3, $4, $5)`,
            [user.id, normalizedEmail, securityCode, resetToken, expiresAt]
        );


        // Send email with security code
        try {
            await sendPasswordResetEmail(normalizedEmail, securityCode, user.username);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            // Clean up the token if email fails
            await query(
                'DELETE FROM password_reset_tokens WHERE reset_token = $1',
                [resetToken]
            );
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again later.'
            });
        }

        res.json({
            success: true,
            message: 'If an account with this email exists, you will receive a password reset code.',
            resetToken // Frontend needs this to proceed to verification step
        });


    } catch (error) {
        console.error('❌ Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Verify security code
export const verifyResetCode = async (req: Request, res: Response) => {
    try {
        const { resetToken, securityCode } = req.body;


        // Find the reset token
        const tokenResult = await query(
            `SELECT id, user_id, email, security_code, expires_at, used 
                FROM password_reset_tokens 
                WHERE reset_token = $1`,
            [resetToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.'
            });
        }

        const resetData = tokenResult.rows[0];

        // Check if token is already used
        if (resetData.used) {
            return res.status(400).json({
                success: false,
                message: 'This reset token has already been used.'
            });
        }

        // Check if token is expired
        if (new Date() > new Date(resetData.expires_at)) {
            await query(
                'DELETE FROM password_reset_tokens WHERE id = $1',
                [resetData.id]
            );
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired. Please request a new password reset.'
            });
        }

        // Verify security code
        if (resetData.security_code !== securityCode) {
            return res.status(400).json({
                success: false,
                message: 'Invalid security code. Please check your email and try again.'
            });
        }


        res.json({
            success: true,
            message: 'Security code verified successfully. You can now reset your password.',
            resetToken // Return the same token for the next step
        });

    } catch (error) {
        console.error(' Verify reset code error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Reset password with verified token
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { resetToken, newPassword } = req.body;


        // Find the reset token
        const tokenResult = await query(
            `SELECT id, user_id, email, expires_at, used 
                FROM password_reset_tokens 
                WHERE reset_token = $1`,
            [resetToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token.'
            });
        }

        const resetData = tokenResult.rows[0];

        // Check if token is already used
        if (resetData.used) {
            return res.status(400).json({
                success: false,
                message: 'This reset token has already been used.'
            });
        }

        // Check if token is expired
        if (new Date() > new Date(resetData.expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired. Please request a new password reset.'
            });
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update user password
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, resetData.user_id]
        );

        // Mark token as used
        await query(
            'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1',
            [resetData.id]
        );

        // Get user details for email
        const userResult = await query(
            'SELECT username FROM users WHERE id = $1',
            [resetData.user_id]
        );
        const user = userResult.rows[0];

        // Send success email
        try {
            await sendPasswordResetSuccessEmail(resetData.email, user?.username);
        } catch (emailError) {
            console.error('Failed to send password reset success email:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Verify email address
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;


        // Find the verification token
        const tokenResult = await query(
            `SELECT id, user_id, expires_at 
             FROM email_verification_tokens 
             WHERE token = $1`,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token.'
            });
        }

        const verificationData = tokenResult.rows[0];

        // Check if token is expired
        if (new Date() > new Date(verificationData.expires_at)) {
            await query(
                'DELETE FROM email_verification_tokens WHERE id = $1',
                [verificationData.id]
            );
            return res.status(400).json({
                success: false,
                message: 'Verification token has expired. Please register again.'
            });
        }

        // Update user as verified
        await query(
            'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1',
            [verificationData.user_id]
        );

        // Delete the used token
        await query(
            'DELETE FROM email_verification_tokens WHERE id = $1',
            [verificationData.id]
        );


        res.json({
            success: true,
            message: 'Email verified successfully. You can now login.'
        });

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/**
 * Resend email verification link
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user by email
        const userResult = await query(
            'SELECT id, username, email, email_verified FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // Don't reveal if email exists for security
            return res.json({
                success: true,
                message: 'If an account exists with this email, a verification link has been sent.'
            });
        }

        const user = userResult.rows[0];

        // Check if already verified
        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified. You can log in now.'
            });
        }

        // Delete any existing verification tokens for this user
        await query(
            'DELETE FROM email_verification_tokens WHERE user_id = $1',
            [user.id]
        );

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store verification token
        await query(
            `INSERT INTO email_verification_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.id, verificationToken, expiresAt]
        );

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await sendVerificationEmail(user.email, user.username, verificationUrl);


        res.json({
            success: true,
            message: 'Verification email has been resent. Please check your inbox.'
        });

    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
