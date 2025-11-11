import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    sendBuddyRequest,
    getReceivedBuddyRequests,
    getSentBuddyRequests,
    acceptBuddyRequest,
    declineBuddyRequest,
    cancelBuddyRequest,
    getBuddies,
    removeBuddy,
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkBuddyStatus,
    reportUser,
    findBuddies
} from '../controllers/buddy';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Check if we're in development or test mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Rate limiting for buddy actions
const buddyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (isDevelopment || isTest) ? 1000 : 50,
    message: {
        success: false,
        message: 'Too many buddy requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest
});

// All buddy routes require authentication
router.use(authenticateToken);

// Find buddies route
router.get('/find', findBuddies);

// Buddy request routes
router.post('/request', buddyLimiter, sendBuddyRequest);
router.get('/requests/received', getReceivedBuddyRequests);
router.get('/requests/sent', getSentBuddyRequests);
router.post('/requests/:requestId/accept', buddyLimiter, acceptBuddyRequest);
router.post('/requests/:requestId/decline', buddyLimiter, declineBuddyRequest);
router.delete('/requests/:requestId', buddyLimiter, cancelBuddyRequest);

// Buddy management routes
router.get('/', getBuddies);
router.delete('/:buddyId', buddyLimiter, removeBuddy);
router.get('/status/:targetUserId', checkBuddyStatus);

// Blocking routes
router.post('/block', buddyLimiter, blockUser);
router.delete('/block/:targetUserId', buddyLimiter, unblockUser);
router.get('/blocked', getBlockedUsers);

// Reporting routes
router.post('/report', buddyLimiter, reportUser);

export default router;
