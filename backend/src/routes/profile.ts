import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto
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

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Rate limiting for profile routes
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 100 : 30, // Higher limit in development
    message: {
        success: false,
        message: 'Too many profile requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Upload rate limiter (more restrictive)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 20 : 5, // Much lower limit for uploads
    message: {
        success: false,
        message: 'Too many upload attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
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

export default router;