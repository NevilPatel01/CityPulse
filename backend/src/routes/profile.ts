import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto,
    getUserStats,
    getUserBadges,
    getPrivacySettings,
    updatePrivacySettings,
    getEmailPreferences,
    updateEmailPreferences,
    requestDataDeletion
} from '../controllers/profile';
import { getTravelPreferences, updateTravelPreferences } from '../controllers/profile_travel_preferences';
import {
    updateProfileSchema,
    usernameParamSchema,
    profilePhotoSchema,
    validateProfile,
    validateParams
} from '../validators/profile';
import { authenticateToken, optionalAuth } from '../middleware/auth';
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

// Statistics and badges routes (MUST be before /:username to avoid conflict)
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

// Data deletion request route
router.post(
    '/request-deletion',
    profileLimiter,
    authenticateToken,
    requestDataDeletion
);

// Public routes (MUST be last as it has a catch-all param)
router.get(
    '/:username',
    profileLimiter,
    optionalAuth,
    validateParams(usernameParamSchema),
    getProfile
);

// Privacy settings routes
router.get(
    '/privacy/settings',
    profileLimiter,
    authenticateToken,
    getPrivacySettings
);

router.put(
    '/privacy/settings',
    profileLimiter,
    authenticateToken,
    updatePrivacySettings
);

// Email preferences routes
router.get(
    '/email-preferences',
    profileLimiter,
    authenticateToken,
    getEmailPreferences
);

router.put(
    '/email-preferences',
    profileLimiter,
    authenticateToken,
    updateEmailPreferences
);

// Travel preferences routes
router.get(
    '/travel-preferences',
    profileLimiter,
    authenticateToken,
    getTravelPreferences
);

router.put(
    '/travel-preferences',
    profileLimiter,
    authenticateToken,
    updateTravelPreferences
);

export default router;