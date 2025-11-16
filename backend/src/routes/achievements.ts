import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getAllAchievements,
    getUserAchievements,
    getMyAchievementProgress,
    getRecentAchievements,
    getAchievementStats
} from '../controllers/achievements';

const router = Router();

// Public routes (require auth to maintain consistency with tests)
router.get('/', authenticateToken, getAllAchievements);
router.get('/recent', getRecentAchievements);
router.get('/user/:username', authenticateToken, getUserAchievements);

// Protected routes
router.get('/my/progress', authenticateToken, getMyAchievementProgress);
router.get('/my/stats', authenticateToken, getAchievementStats);

export default router;
