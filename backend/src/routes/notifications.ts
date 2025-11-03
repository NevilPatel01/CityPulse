import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead
} from '../controllers/notifications';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Check if we're in development or test mode
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Rate limiting for notification actions
const notificationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: (isDevelopment || isTest) ? 1000 : 100, // Higher limit for polling
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest
});

// All notification routes require authentication
router.use(authenticateToken);

// Get notifications
router.get('/', notificationLimiter, getNotifications);
router.get('/unread-count', notificationLimiter, getUnreadCount);

// Mark as read
router.patch('/:notificationId/read', notificationLimiter, markAsRead);
router.patch('/read-all', notificationLimiter, markAllAsRead);

// Delete notifications
router.delete('/:notificationId', notificationLimiter, deleteNotification);
router.delete('/read/all', notificationLimiter, deleteAllRead);

export default router;
