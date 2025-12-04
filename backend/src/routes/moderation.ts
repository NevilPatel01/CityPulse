import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireModerator } from '../middleware/moderator';
import {
  getDashboardStats,
  getContentReports,
  updateReportStatus,
  removeContent,
  issueWarning,
  suspendUser,
  banUser,
  reinstateUser,
  getUserWarnings,
  getModeratorActions,
  getReportedUsers
} from '../controllers/moderation';

const router = express.Router();

// All routes require authentication and moderator or admin role
router.use(authenticateToken, requireModerator);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/actions', getModeratorActions);

// Content Reports
router.get('/reports', getContentReports);
router.patch('/reports/:reportId/status', updateReportStatus);

// Content Management
router.delete('/content/:contentType/:contentId', removeContent);

// User Management
router.get('/users/reported', getReportedUsers);
router.get('/users/:userId/warnings', getUserWarnings);
router.post('/users/:userId/warn', issueWarning);
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/reinstate', reinstateUser);

export default router;
