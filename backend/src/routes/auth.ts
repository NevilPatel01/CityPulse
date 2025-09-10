import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    register,
    login,
    logout,
    refreshToken,
    getProfile,
    changePassword
} from '../controllers/auth';
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    validate
} from '../validators/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Public routes
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', generalLimiter, logout);
router.post('/refresh', generalLimiter, refreshToken); // TODO: Token refresh endpoint needs to be protected

// Protected routes
router.get('/profile', generalLimiter, authenticateToken, getProfile);
router.put('/change-password', generalLimiter, authenticateToken, validate(changePasswordSchema), changePassword);

export default router;
