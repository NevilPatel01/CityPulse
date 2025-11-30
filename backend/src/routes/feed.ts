import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import {
    getFeed,
    getTrendingRecommendations,
    getActiveBuddies,
    getTopPlacesThisMonth,
    getPopularInCountry,
    getBuddiesActivity
} from '../controllers/feed';

const router = Router();

// Feed routes - require authentication
router.get('/', authenticateToken, getFeed);
router.get('/trending', optionalAuth, getTrendingRecommendations);
router.get('/active-buddies', authenticateToken, getActiveBuddies);
router.get('/top-places-month', authenticateToken, getTopPlacesThisMonth);
router.get('/popular-country', authenticateToken, getPopularInCountry);
router.get('/buddies-activity', authenticateToken, getBuddiesActivity);

export default router;
