import { Request, Response } from 'express';
import pool from '../lib/database';

// Get all notifications for the authenticated user
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { limit = 50, offset = 0, unreadOnly = false } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        let query = `
            SELECT 
                n.id,
                n.title,
                n.message,
                n.notification_type,
                n.related_id,
                n.related_user_id,
                n.action_url,
                n.is_read,
                n.created_at,
                n.read_at,
                u.username as related_user_username,
                u.full_name as related_user_name,
                up.profile_photo_url as related_user_photo
            FROM notifications n
            LEFT JOIN users u ON n.related_user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE n.user_id = $1
        `;

        const params: any[] = [userId];

        if (unreadOnly === 'true') {
            query += ` AND n.is_read = false`;
        }

        query += ` ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`;
        params.push(parseInt(limit as string), parseInt(offset as string));

        const result = await pool.query(query, params);

        // Get unread count
        const unreadResult = await pool.query(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({
            success: true,
            data: {
                notifications: result.rows,
                unreadCount: parseInt(unreadResult.rows[0].unread_count),
                total: result.rows.length
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({
            success: true,
            data: {
                unreadCount: parseInt(result.rows[0].unread_count)
            }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count'
        });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await pool.query(
            'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false',
            [userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read'
        });
    }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
            [notificationId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
};

// Delete all read notifications
export const deleteAllRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await pool.query(
            'DELETE FROM notifications WHERE user_id = $1 AND is_read = true',
            [userId]
        );

        res.json({
            success: true,
            message: 'All read notifications deleted'
        });

    } catch (error) {
        console.error('Delete all read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notifications'
        });
    }
};
