import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto,
    getUserStats,
    getUserBadges
} from '../controllers/profile';
import {
    updateProfileSchema,
    usernameParamSchema,
    profilePhotoSchema,
    validateProfile,
    validateParams
} from '../validators/profile';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../utils/imageUpload';

const router = Router();

// Check if we're in development or test mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Rate limiting for profile routes
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (isDevelopment || isTest) ? 1000 : 30, // Higher limit in development/test
    message: {
        success: false,
        message: 'Too many profile requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest // Skip rate limiting entirely in test mode
});

// Upload rate limiter (more restrictive)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (isDevelopment || isTest) ? 1000 : 5, // Much lower limit for uploads in production
    message: {
        success: false,
        message: 'Too many upload attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest // Skip rate limiting entirely in test mode
});

// Public routes
router.get(
    '/:username',
    profileLimiter,
    validateParams(usernameParamSchema),
    getProfile
);

// Protected routes (require authentication)
router.put(
    '/',
    profileLimiter,
    authenticateToken,
    validateProfile(updateProfileSchema),
    updateProfile
);

// Photo upload routes
router.post(
    '/photo',
    uploadLimiter,
    authenticateToken,
    upload.single('photo'),
    validateProfile(profilePhotoSchema),
    uploadProfilePhoto
);

// Photo deletion routes
router.delete(
    '/photo/:type',
    profileLimiter,
    authenticateToken,
    deleteProfilePhoto
);

// Statistics and badges routes
router.get(
    '/stats',
    profileLimiter,
    authenticateToken,
    getUserStats
);

router.get(
    '/badges',
    profileLimiter,
    authenticateToken,
    getUserBadges
);

export default router;