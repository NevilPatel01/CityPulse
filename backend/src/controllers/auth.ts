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
import {
    sendPasswordResetEmail,
    sendPasswordResetSuccessEmail,
    generateSecurityCode,
    generateResetToken
} from '../services/emailService';

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
            console.log(`[AUTH] User profiles record created for user: ${user.id}`);
        } catch (profileError) {
            console.error(`[AUTH] Error creating user_profiles record:`, profileError);
            // Continue with registration even if profile creation fails
        }

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

        // Convert email to lowercase
        const normalizedEmail = email.toLowerCase().trim();

        // Find user
        const userResult = await query(
            'SELECT * FROM users WHERE email = $1',
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
            data: { 
                user: {
                    id: user.id.toString(),
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
        const { code, redirectUri, googleId: directGoogleId, email: directEmail, name: directName, picture: directPicture, accessToken } = req.body;

        console.log('🔧 Google OAuth request received with authorization code');

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
            console.log('✅ Token exchange successful');

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
            console.log('✅ User info retrieved:', googleUser.email);

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
            console.log('✅ Using direct user data for testing');
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

        // Check if user already exists (by email or google ID)
        const existingUserResult = await query(
            'SELECT * FROM users WHERE email = $1 OR google_id = $2',
            [normalizedEmail, googleId]
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
            console.log('New user created:', user.id);

            // Create user_profiles record for new Google OAuth user
            try {
                await query(
                    `INSERT INTO user_profiles (user_id) VALUES ($1)`,
                    [user.id]
                );
                console.log(`[GOOGLE_AUTH] User profiles record created for user: ${user.id}`);
            } catch (profileError) {
                console.error(`[GOOGLE_AUTH] Error creating user_profiles record:`, profileError);
                // Continue with authentication even if profile creation fails
            }
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

        console.log('Google OAuth authentication successful for user:', user.id);

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

        console.log('🔐 Password reset requested for:', normalizedEmail);

        // Check if user exists
        const userResult = await query(
            'SELECT id, email, username, full_name, is_google_user FROM users WHERE email = $1',
            [normalizedEmail]
        );

        // Always return success to prevent email enumeration
        if (userResult.rows.length === 0) {
            console.log('Password reset requested for non-existent email:', normalizedEmail);
            return res.json({
                success: true,
                message: 'If an account with this email exists, you will receive a password reset code.'
            });
        }

        const user = userResult.rows[0];

        // Allow Google OAuth users to set backup passwords
        if (user.is_google_user) {
            console.log('Password reset requested for Google OAuth user:', normalizedEmail);
            console.log('Allowing backup password setup for OAuth user');
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

        console.log('🔑 [RESET] Generated security code:', securityCode);
        console.log('🔑 [RESET] Generated reset token:', resetToken);

        // Store reset token in database
        await query(
            `INSERT INTO password_reset_tokens 
                (user_id, email, security_code, reset_token, expires_at) 
                VALUES ($1, $2, $3, $4, $5)`,
            [user.id, normalizedEmail, securityCode, resetToken, expiresAt]
        );

        console.log('[RESET] Token stored in database successfully');

        // Send email with security code
        try {
            await sendPasswordResetEmail(normalizedEmail, securityCode, user.username);
            console.log('Password reset email sent to:', normalizedEmail);
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

        console.log('📤 [RESET] Response sent with resetToken:', resetToken);

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

        console.log('🔐 Verifying reset code for token:', resetToken?.substring(0, 8) + '...');

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

        console.log('Security code verified for user:', resetData.user_id);

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

        console.log('🔐 Resetting password for token:', resetToken?.substring(0, 8) + '...');

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

        // Get user details
        const userResult = await query(
            'SELECT id, username, full_name FROM users WHERE id = $1',
            [resetData.user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User not found.'
            });
        }

        const user = userResult.rows[0];

        // Hash the new password
        const passwordHash = await hashPassword(newPassword);

        // Update user's password
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, resetData.user_id]
        );

        // Mark the reset token as used
        await query(
            'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1',
            [resetData.id]
        );

        // Clean up any other unused tokens for this user
        await query(
            'DELETE FROM password_reset_tokens WHERE user_id = $1 AND used = FALSE',
            [resetData.user_id]
        );

        // Send success notification email
        try {
            await sendPasswordResetSuccessEmail(resetData.email, user.username);
        } catch (emailError) {
            console.error('Failed to send password reset success email:', emailError);
            // Don't fail the request if success email fails
        }

        console.log('Password reset successful for user:', resetData.user_id);

        res.json({
            success: true,
            message: 'Password reset successful. You can now sign in with your new password.'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
