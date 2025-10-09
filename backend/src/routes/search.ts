import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
    searchAll, 
    searchRecommendations, 
    searchUsers, 
    searchCities 
} from '../controllers/search';

const router = Router();

// All search endpoints require authentication
router.use(authenticateToken);

/**
 * @route GET /api/search
 * @desc Search across all content types (recommendations, users, cities)
 * @access Private
 * @query {string} q - Search query (required)
 * @query {string} type - Filter by type: recommendations|users|cities (optional)
 * @query {number} limit - Results limit (default: 20, max: 50)
 * @query {number} offset - Results offset (default: 0)
 */
router.get('/', searchAll);

/**
 * @route GET /api/search/recommendations
 * @desc Search recommendations/places
 * @access Private
 * @query {string} q - Search query (required)
 * @query {string} category - Filter by category (optional)
 * @query {string} city - Filter by city (optional)
 * @query {number} limit - Results limit (default: 20, max: 50)
 * @query {number} offset - Results offset (default: 0)
 */
router.get('/recommendations', searchRecommendations);

/**
 * @route GET /api/search/users
 * @desc Search users/buddies
 * @access Private
 * @query {string} q - Search query (required)
 * @query {string} location - Filter by location (optional)
 * @query {number} limit - Results limit (default: 20, max: 50)
 * @query {number} offset - Results offset (default: 0)
 */
router.get('/users', searchUsers);

/**
 * @route GET /api/search/cities
 * @desc Search cities
 * @access Private
 * @query {string} q - Search query (required)
 * @query {number} limit - Results limit (default: 20, max: 50)
 * @query {number} offset - Results offset (default: 0)
 */
router.get('/cities', searchCities);

export default router;