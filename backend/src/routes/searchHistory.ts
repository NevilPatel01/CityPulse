import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    saveSearchHistory,
    getSearchHistory,
    deleteSearchHistory,
    clearSearchHistory,
    saveSearch,
    getSavedSearches,
    updateSavedSearch,
    deleteSavedSearch
} from '../controllers/searchHistory';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Search History Routes
 */
router.post('/history', saveSearchHistory);
router.get('/history', getSearchHistory);
router.delete('/history/:id', deleteSearchHistory);
router.delete('/history', clearSearchHistory);

/**
 * Saved Searches Routes
 */
router.post('/saved', saveSearch);
router.get('/saved', getSavedSearches);
router.put('/saved/:id', updateSavedSearch);
router.delete('/saved/:id', deleteSavedSearch);

export default router;

