import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    changePassword,
    googleOAuth,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    verifyEmail,
    resendVerificationEmail
} from '../controllers/auth';
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    resetPasswordRequestSchema,
    verifyResetCodeSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    validate
} from '../validators/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Check if we're in development or test mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (isDevelopment || isTest) ? 1000 : 5, // Much higher limit in development/test
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest // Skip rate limiting entirely in test mode
});

// More lenient rate limiter for OAuth endpoints (callbacks can happen multiple times during dev)
const oAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (isDevelopment || isTest) ? 1000 : 20, // TODO: Very high limit in development for OAuth testing, for production it's need to change
    message: {
        success: false,
        message: 'Too many OAuth attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest // Skip rate limiting entirely in test mode
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs in dev/test
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest // Skip rate limiting entirely in test mode
});

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', oAuthLimiter, googleOAuth); // Google OAuth endpoint with more lenient rate limiting
router.post('/logout', generalLimiter, logout);
router.post('/refresh', generalLimiter, refreshToken); // TODO: Token refresh endpoint needs to be protected

// Email verification
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationEmail);

// Password reset routes
router.post('/reset-password/request', authLimiter, validate(resetPasswordRequestSchema), requestPasswordReset);
router.post('/reset-password/verify', authLimiter, validate(verifyResetCodeSchema), verifyResetCode);
router.post('/reset-password/confirm', authLimiter, validate(resetPasswordSchema), resetPassword);

// Handle wrong method calls to verify endpoint
router.get('/reset-password/verify', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Method Not Allowed. Use POST instead of GET for verification.',
        correctMethod: 'POST',
        correctPayload: { resetToken: 'string', securityCode: 'string' }
    });
});

// Protected routes
router.get('/profile', generalLimiter, authenticateToken, getProfile);
router.put('/change-password', generalLimiter, authenticateToken, validate(changePasswordSchema), changePassword);

export default router;
