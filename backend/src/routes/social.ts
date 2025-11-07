import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    toggleBookmark,
    getBookmarkedRecommendations,
    checkBookmarkStatus,
    recordShare,
    reportRecommendation,
    setUserInterests,
    getUserInterests,
    getUserStats
} from '../controllers/social';

const router = Router();

// Bookmark routes
router.post('/bookmarks/:recommendationId', authenticateToken, toggleBookmark);
router.get('/bookmarks', authenticateToken, getBookmarkedRecommendations);
router.get('/bookmarks/:recommendationId/status', authenticateToken, checkBookmarkStatus);

// Share routes
router.post('/shares/:recommendationId', authenticateToken, recordShare);

// Report routes
router.post('/reports/:recommendationId', authenticateToken, reportRecommendation);

// User interests routes
router.post('/interests', authenticateToken, setUserInterests);
router.get('/interests', authenticateToken, getUserInterests);

// User stats routes
router.get('/stats', authenticateToken, getUserStats);

export default router;
