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

// Public routes
router.get('/', getAllAchievements);
router.get('/recent', getRecentAchievements);
router.get('/user/:username', getUserAchievements);

// Protected routes
router.get('/my/progress', authenticateToken, getMyAchievementProgress);
router.get('/my/stats', authenticateToken, getAchievementStats);

export default router;
