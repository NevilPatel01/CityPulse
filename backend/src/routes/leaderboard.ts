import { Router } from 'express';
import {
    getLeaderboard,
    getMyLeaderboardPosition
} from '../controllers/leaderboard';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/leaderboard
 * @desc Get leaderboard of top users
 * @access Public (optional auth - can show personalized data if authenticated)
 * @query {number} limit - Number of results (default: 10, max: 100)
 * @query {string} type - Leaderboard type: 'all', 'achievements', 'badges' (default: 'all')
 */
router.get('/', optionalAuthenticateToken, getLeaderboard);

/**
 * @route GET /api/leaderboard/me
 * @desc Get current user's leaderboard position
 * @access Private
 */
router.get('/me', authenticateToken, getMyLeaderboardPosition);

export default router;

