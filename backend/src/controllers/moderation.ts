import { Request, Response } from 'express';
import pool from '../lib/database';

/**
 * Get dashboard statistics for moderator
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const moderatorId = req.user!.userId;

        const statsQuery = `
        SELECT 
        (SELECT COUNT(*) FROM content_reports WHERE status = 'pending') as pending_reports,
        (SELECT COUNT(*) FROM content_reports WHERE status = 'under_review') as under_review_reports,
        (SELECT COUNT(*) FROM recommendations WHERE status = 'reported') as reported_recommendations,
        (SELECT COUNT(*) FROM users WHERE account_status = 'suspended') as suspended_users,
        (SELECT COUNT(*) FROM users WHERE account_status = 'banned') as banned_users,
        (SELECT COUNT(*) FROM user_warnings WHERE is_active = true) as active_warnings,
        (SELECT COUNT(*) FROM moderator_actions WHERE moderator_id = $1 AND created_at > NOW() - INTERVAL '30 days') as my_actions_30d
    `;

        const result = await pool.query(statsQuery, [moderatorId]);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
};

/**
 * Get all content reports with pagination
 */
export const getContentReports = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string || 'all';
        const contentType = req.query.contentType as string || 'all';
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams: any[] = [];
        let paramIndex = 1;

        if (status !== 'all') {
            whereConditions.push(`cr.status = $${paramIndex}`);
            queryParams.push(status);
            paramIndex++;
        }

        if (contentType !== 'all') {
            whereConditions.push(`cr.reported_content_type = $${paramIndex}`);
            queryParams.push(contentType);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const reportsQuery = `
        SELECT 
        cr.*,
        u.username as reporter_username,
        up.profile_photo_url as reporter_photo,
        m.username as reviewer_username,
        CASE 
            WHEN cr.reported_content_type = 'recommendation' THEN (SELECT title FROM recommendations WHERE id = cr.reported_content_id)
            WHEN cr.reported_content_type = 'profile' THEN (SELECT username FROM users WHERE id = cr.reported_content_id)
            WHEN cr.reported_content_type = 'trip' THEN (SELECT title FROM trips WHERE id = cr.reported_content_id)
            ELSE 'Unknown'
        END as content_title,
        CASE 
            WHEN cr.reported_content_type = 'recommendation' THEN (SELECT description FROM recommendations WHERE id = cr.reported_content_id)
            WHEN cr.reported_content_type = 'profile' THEN (SELECT bio FROM user_profiles WHERE user_id = cr.reported_content_id)
            WHEN cr.reported_content_type = 'trip' THEN (SELECT description FROM trips WHERE id = cr.reported_content_id)
            ELSE NULL
        END as content_description,
        CASE 
            WHEN cr.reported_content_type = 'recommendation' THEN (SELECT cover_photo FROM recommendations WHERE id = cr.reported_content_id)
            WHEN cr.reported_content_type = 'profile' THEN (SELECT profile_photo_url FROM user_profiles WHERE user_id = cr.reported_content_id)
            WHEN cr.reported_content_type = 'trip' THEN NULL
            ELSE NULL
        END as content_image
        FROM content_reports cr
        JOIN users u ON cr.reporter_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN users m ON cr.reviewed_by = m.id
        ${whereClause}
        ORDER BY cr.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        queryParams.push(limit, offset);

        const countQuery = `
        SELECT COUNT(*) as total
        FROM content_reports cr
        ${whereClause}
    `;

        const [reportsResult, countResult] = await Promise.all([
            pool.query(reportsQuery, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                reports: reportsResult.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    hasMore: page < totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error fetching content reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch content reports'
        });
    }
};

/**
 * Update report status
 */
export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const moderatorId = req.user!.userId;
        const { reportId } = req.params;
        const { status, notes } = req.body;

        if (!['under_review', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        const updateQuery = `
        UPDATE content_reports
        SET status = $1, reviewed_by = $2, reviewed_at = NOW()
        WHERE id = $3
      RETURNING *
    `;

        const result = await pool.query(updateQuery, [status, moderatorId, reportId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Report not found'
            });
        }

        // Log moderator action
        await pool.query(
            `INSERT INTO moderator_actions (moderator_id, action_type, target_type, target_id, reason, notes)
        VALUES ($1, $2, $3, $4, $5, $6)`,
            [moderatorId, 'report_status_update', 'content_report', reportId, `Status changed to ${status}`, notes || null]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update report status'
        });
    }
};

/**
 * Remove content (soft delete)
 */
export const removeContent = async (req: Request, res: Response) => {
    try {
        const moderatorId = req.user!.userId;
        const { contentType, contentId } = req.params;
        const { reason, notifyUser = true } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Reason is required'
            });
        }

        let contentOwnerId = null;
        let contentTitle = '';

        // Soft delete based on content type
        if (contentType === 'recommendation') {
            const result = await pool.query(
                `UPDATE recommendations SET status = 'removed', report_reason = $1 WHERE id = $2 RETURNING user_id, title`,
                [reason, contentId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Content not found' });
            }
            contentOwnerId = result.rows[0].user_id;
            contentTitle = result.rows[0].title;
        } else if (contentType === 'trip') {
            const result = await pool.query(
                `UPDATE trips SET status = 'cancelled' WHERE id = $1 RETURNING user_id, title`,
                [contentId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Content not found' });
            }
            contentOwnerId = result.rows[0].user_id;
            contentTitle = result.rows[0].title;
        } else if (contentType === 'profile') {
            const result = await pool.query(
                `UPDATE users SET account_status = 'suspended' WHERE id = $1 RETURNING id, username`,
                [contentId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Content not found' });
            }
            contentOwnerId = result.rows[0].id;
            contentTitle = `Profile: ${result.rows[0].username}`;
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid content type'
            });
        }

        // Log moderator action
        await pool.query(
            `INSERT INTO moderator_actions (moderator_id, action_type, target_type, target_id, reason)
        VALUES ($1, $2, $3, $4, $5)`,
            [moderatorId, 'content_removal', contentType, contentId, reason]
        );

        // Notify user if enabled
        if (notifyUser && contentOwnerId) {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, notification_type, related_id, related_user_id)
        VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    contentOwnerId,
                    'Content Removed',
                    `Your ${contentType} "${contentTitle}" has been removed by a moderator. Reason: ${reason}`,
                    'system',
                    parseInt(contentId),
                    moderatorId
                ]
            );
        }

        res.json({
            success: true,
            message: 'Content removed successfully'
        });
    } catch (error) {
        console.error('Error removing content:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove content'
        });
    }
};

/**
 * Issue warning to user
 */
export const issueWarning = async (req: Request, res: Response) => {
    try {
        const moderatorId = req.user!.userId;
        const { userId } = req.params;
        const { warningType, message, severity = 'low' } = req.body;

        if (!warningType || !message) {
            return res.status(400).json({
                success: false,
                error: 'Warning type and message are required'
            });
        }

        if (!['low', 'medium', 'high'].includes(severity)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid severity level'
            });
        }

        // Insert warning
        const warningResult = await pool.query(
            `INSERT INTO user_warnings (user_id, moderator_id, warning_type, message, is_active)
        VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
            [userId, moderatorId, warningType, message]
        );

        // Get active warnings count
        const warningCountResult = await pool.query(
            `SELECT COUNT(*) as count FROM user_warnings WHERE user_id = $1 AND is_active = true`,
            [userId]
        );
        const activeWarnings = parseInt(warningCountResult.rows[0].count);

        // Auto-suspend logic based on severity and count
        let accountStatus = 'active';
        let suspensionDays = 0;

        if (severity === 'high' && activeWarnings >= 2) {
            accountStatus = 'banned';
            await pool.query(`UPDATE users SET account_status = 'banned' WHERE id = $1`, [userId]);
        } else if (severity === 'medium' && activeWarnings >= 3) {
            accountStatus = 'suspended';
            suspensionDays = 7;
            await pool.query(`UPDATE users SET account_status = 'suspended' WHERE id = $1`, [userId]);
        } else if (severity === 'low' && activeWarnings >= 5) {
            accountStatus = 'suspended';
            suspensionDays = 3;
            await pool.query(`UPDATE users SET account_status = 'suspended' WHERE id = $1`, [userId]);
        }

        // Log moderator action
        await pool.query(
            `INSERT INTO moderator_actions (moderator_id, action_type, target_type, target_id, reason, notes)
        VALUES ($1, $2, $3, $4, $5, $6)`,
            [moderatorId, 'warning_issued', 'user', userId, warningType, `Severity: ${severity}, Active warnings: ${activeWarnings}`]
        );

        // Notify user
        let notificationMessage = `You have received a ${severity} warning from a moderator. ${message}`;
        if (accountStatus === 'banned') {
            notificationMessage += ' Your account has been banned due to multiple violations.';
        } else if (accountStatus === 'suspended') {
            notificationMessage += ` Your account has been suspended for ${suspensionDays} days.`;
        }

        await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'Warning Issued', notificationMessage, 'system', moderatorId]
        );

        res.json({
            success: true,
            data: {
                warning: warningResult.rows[0],
                activeWarnings,
                accountStatus,
                suspensionDays
            }
        });
    } catch (error) {
        console.error('Error issuing warning:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to issue warning'
        });
    }
};

/**
 * Suspend user
 */
export const suspendUser = async (req: Request, res: Response) => {
    try {
        const moderatorId = req.user!.userId;
        const { userId } = req.params;
        const { reason, days = 7 } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Reason is required'
            });
        }

        await pool.query(
            `UPDATE users SET account_status = 'suspended' WHERE id = $1`,
            [userId]
        );

        // Log moderator action
        await pool.query(
            `INSERT INTO moderator_actions (moderator_id, action_type, target_type, target_id, reason, notes)
        VALUES ($1, $2, $3, $4, $5, $6)`,
            [moderatorId, 'user_suspension', 'user', userId, reason, `Duration: ${days} days`]
        );

        // Notify user
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
        VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                'Account Suspended',
                `Your account has been suspended for ${days} days. Reason: ${reason}`,
                'system',
                moderatorId
            ]
        );

        res.json({
            success: true,
            message: 'User suspended successfully'
        });
    } catch (error) {
        console.error('Error suspending user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to suspend user'
        });
    }
};

/**
 * Ban user
 */
export const banUser = async (req: Request, res: Response) => {
    try {
        const moderatorId = req.user!.userId;
        const { userId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Reason is required'
            });
        }

        await pool.query(
            `UPDATE users SET account_status = 'banned' WHERE id = $1`,
            [userId]
        );

        // Log moderator action
        await pool.query(
            `INSERT INTO moderator_actions (moderator_id, action_type, target_type, target_id, reason)
        VALUES ($1, $2, $3, $4, $5)`,
            [moderatorId, 'user_ban', 'user', userId, reason]
        );

        // Notify user
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
        VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                'Account Banned',
                `Your account has been permanently banned. Reason: ${reason}`,
                'system',
                moderatorId
            ]
        );

        res.json({
            success: true,
            message: 'User banned successfully'
        });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to ban user'
        });
    }
};

/**
 * Unban/unsuspend user
 */
export const reinstateUser = async (req: Request, res: Response) => {
    try {
        const moderatorId = req.user!.userId;
        const { userId } = req.params;
        const { reason } = req.body;

        await pool.query(
            `UPDATE users SET account_status = 'active' WHERE id = $1`,
            [userId]
        );

        // Deactivate all warnings
        await pool.query(
            `UPDATE user_warnings SET is_active = false WHERE user_id = $1`,
            [userId]
        );

        // Log moderator action
        await pool.query(
            `INSERT INTO moderator_actions (moderator_id, action_type, target_type, target_id, reason)
        VALUES ($1, $2, $3, $4, $5)`,
            [moderatorId, 'user_reinstatement', 'user', userId, reason || 'Account reinstated']
        );

        // Notify user
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
        VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                'Account Reinstated',
                'Your account has been reinstated. You can now use CityPulse normally.',
                'system',
                moderatorId
            ]
        );

        res.json({
            success: true,
            message: 'User reinstated successfully'
        });
    } catch (error) {
        console.error('Error reinstating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reinstate user'
        });
    }
};

/**
 * Get user warnings
 */
export const getUserWarnings = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const warningsQuery = `
        SELECT 
        uw.*,
        u.username as moderator_username
        FROM user_warnings uw
        JOIN users u ON uw.moderator_id = u.id
        WHERE uw.user_id = $1
        ORDER BY uw.created_at DESC
    `;

        const result = await pool.query(warningsQuery, [userId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching user warnings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user warnings'
        });
    }
};

/**
 * Get moderator action log
 */
export const getModeratorActions = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const actionsQuery = `
        SELECT 
        ma.*,
        u.username as moderator_username,
        up.profile_photo_url as moderator_photo
        FROM moderator_actions ma
        JOIN users u ON ma.moderator_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        ORDER BY ma.created_at DESC
        LIMIT $1 OFFSET $2
    `;

        const countQuery = `SELECT COUNT(*) as total FROM moderator_actions`;

        const [actionsResult, countResult] = await Promise.all([
            pool.query(actionsQuery, [limit, offset]),
            pool.query(countQuery)
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                actions: actionsResult.rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    hasMore: page < totalPages
                }
            }
        });
    } catch (error) {
        console.error('Error fetching moderator actions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch moderator actions'
        });
    }
};

/**
 * Get reported users
 */
export const getReportedUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const usersQuery = `
        SELECT 
        u.id,
        u.username,
        u.email,
        u.account_status,
        up.profile_photo_url,
        (SELECT COUNT(*) FROM user_warnings WHERE user_id = u.id AND is_active = true) as active_warnings,
        (SELECT COUNT(*) FROM content_reports WHERE reported_content_type = 'profile' AND reported_content_id = u.id) as report_count,
        u.created_at
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id IN (
        SELECT DISTINCT reported_content_id 
        FROM content_reports 
        WHERE reported_content_type = 'profile'
        )
        OR u.id IN (
        SELECT DISTINCT user_id 
        FROM user_warnings
        )
        ORDER BY active_warnings DESC, report_count DESC
        LIMIT $1 OFFSET $2
    `;

        const result = await pool.query(usersQuery, [limit, offset]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching reported users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reported users'
        });
    }
};
