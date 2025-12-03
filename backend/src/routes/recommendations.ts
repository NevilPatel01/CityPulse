import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getRecommendations,
    getRecommendationById,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    uploadRecommendationPhotos,
    deleteRecommendationPhoto,
    setPrimaryRecommendationPhoto,
    getRecommendationCategories,
    getCities,
    submitRating,
    getUserRating,
    getRatingsList,
    deleteRating,
    likeRecommendation,
    unlikeRecommendation,
    checkLikeStatus,
    getLikedRecommendations,
    saveRecommendation,
    unsaveRecommendation,
    checkSaveStatus,
    trackView,
    getSavedRecommendations
} from '../controllers/recommendations';
import {
    createRecommendationSchema,
    updateRecommendationSchema,
    getRecommendationsSchema,
    getCitiesSchema,
    validate,
    validateQuery
} from '../validators/recommendations';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';
import { uploadMultiple } from '../utils/imageUpload';

const router = Router();

// Check if we're in development or test mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Rate limiting for recommendation routes
const recommendationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (isDevelopment || isTest) ? 1000 : 50, // Higher limit in development/test
    message: {
        success: false,
        message: 'Too many recommendation requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest // Skip rate limiting entirely in test mode
});

// Upload rate limiter (more restrictive)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (isDevelopment || isTest) ? 1000 : 10, // Much lower limit for uploads in production
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
    optionalAuthenticateToken,
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
    uploadMultiple.array('photos', 10), // Accept photos in create request
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

router.delete(
    '/:id/photos/:photoId',
    recommendationLimiter,
    authenticateToken,
    deleteRecommendationPhoto
);

router.patch(
    '/:id/photos/:photoId/primary',
    recommendationLimiter,
    authenticateToken,
    setPrimaryRecommendationPhoto
);

// Rating routes
router.post(
    '/:id/ratings',
    recommendationLimiter,
    authenticateToken,
    submitRating
);

router.post(
    '/:id/rate',
    recommendationLimiter,
    authenticateToken,
    submitRating
); // Alternative route for rating

router.get(
    '/:id/ratings/me',
    recommendationLimiter,
    authenticateToken,
    getUserRating
);

router.get(
    '/:id/ratings/list',
    recommendationLimiter,
    getRatingsList
);

router.delete(
    '/:id/ratings',
    recommendationLimiter,
    authenticateToken,
    deleteRating
);

// Like/Unlike routes
router.post(
    '/:id/like',
    recommendationLimiter,
    authenticateToken,
    likeRecommendation
);

router.delete(
    '/:id/like',
    recommendationLimiter,
    authenticateToken,
    unlikeRecommendation
);

router.get(
    '/:id/like/status',
    recommendationLimiter,
    authenticateToken,
    checkLikeStatus
);

router.get(
    '/user/liked',
    recommendationLimiter,
    authenticateToken,
    getLikedRecommendations
);

// Save/Unsave routes
router.post(
    '/:id/save',
    recommendationLimiter,
    authenticateToken,
    saveRecommendation
);

router.delete(
    '/:id/save',
    recommendationLimiter,
    authenticateToken,
    unsaveRecommendation
);

router.get(
    '/:id/save/status',
    recommendationLimiter,
    authenticateToken,
    checkSaveStatus
);

router.get(
    '/user/saved',
    recommendationLimiter,
    authenticateToken,
    getSavedRecommendations
);

// View tracking
router.post(
    '/:id/view',
    recommendationLimiter,
    optionalAuthenticateToken,
    trackView
);

export default router;
