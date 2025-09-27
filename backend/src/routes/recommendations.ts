import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getRecommendations,
    getRecommendationById,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    uploadRecommendationPhotos,
    getRecommendationCategories,
    getCities
} from '../controllers/recommendations';
import {
    createRecommendationSchema,
    updateRecommendationSchema,
    getRecommendationsSchema,
    getCitiesSchema,
    validate,
    validateQuery
} from '../validators/recommendations';
import { authenticateToken } from '../middleware/auth';
import { uploadMultiple } from '../utils/imageUpload';

const router = Router();

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Rate limiting for recommendation routes
const recommendationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 100 : 50, // Higher limit in development
    message: {
        success: false,
        message: 'Too many recommendation requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Upload rate limiter (more restrictive)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 20 : 10, // Much lower limit for uploads
    message: {
        success: false,
        message: 'Too many upload attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Public routes
router.get(
    '/',
    recommendationLimiter,
    validateQuery(getRecommendationsSchema),
    getRecommendations
);

router.get(
    '/categories',
    recommendationLimiter,
    getRecommendationCategories
);

router.get(
    '/cities',
    recommendationLimiter,
    validateQuery(getCitiesSchema),
    getCities
);

router.get(
    '/:id',
    recommendationLimiter,
    getRecommendationById
);

// Protected routes (require authentication)
router.post(
    '/',
    recommendationLimiter,
    authenticateToken,
    validate(createRecommendationSchema),
    createRecommendation
);

router.put(
    '/:id',
    recommendationLimiter,
    authenticateToken,
    validate(updateRecommendationSchema),
    updateRecommendation
);

router.delete(
    '/:id',
    recommendationLimiter,
    authenticateToken,
    deleteRecommendation
);

router.post(
    '/:id/photos',
    uploadLimiter,
    authenticateToken,
    uploadMultiple.array('photos', 10), // Max 10 photos
    uploadRecommendationPhotos
);

export default router;
