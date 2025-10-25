import express from 'express';
import { advancedSearch, getSearchFilters } from '../controllers/advancedSearch';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get available filter options (categories, cities, difficulties, etc.)
router.get('/filters', getSearchFilters);

// Advanced search endpoint with all filters
router.get('/', authenticateToken, advancedSearch);

export default router;
