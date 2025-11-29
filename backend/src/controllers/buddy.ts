import { Request, Response } from 'express';
import pool from '../lib/database';
import { createNotification } from '../utils/notifications';

// Note: Request type is extended in middleware/auth.ts to include user property

// Send buddy request
export const sendBuddyRequest = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { targetUserId, message } = req.body;
        const requesterId = req.user?.userId;

        if (!requesterId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Validate target user
        if (!targetUserId || requesterId === targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target user'
            });
        }

        await client.query('BEGIN');

        // Check if target user exists
        const targetUserResult = await client.query(
            'SELECT id, username FROM users WHERE id = $1 AND account_status = $2',
            [targetUserId, 'active']
        );

        if (targetUserResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if requester is blocked by target user
        const blockCheck = await client.query(
            'SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
            [targetUserId, requesterId]
        );

        if (blockCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                message: 'Unable to send buddy request'
            });
        }

        // Check if requester has blocked target user
        const reverseBlockCheck = await client.query(
            'SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
            [requesterId, targetUserId]
        );

        if (reverseBlockCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'You have blocked this user. Unblock them first to send a buddy request.'
            });
        }

        // Check if buddy request already exists
        const existingRequest = await client.query(
            'SELECT id, status FROM travel_buddy_connections WHERE (requester_id = $1 AND requested_id = $2) OR (requester_id = $2 AND requested_id = $1)',
            [requesterId, targetUserId]
        );

        if (existingRequest.rows.length > 0) {
            await client.query('ROLLBACK');
            const status = existingRequest.rows[0].status;

            if (status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'You are already buddies with this user'
                });
            } else if (status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'A buddy request is already pending'
                });
            }
        }

        // Check target user's privacy settings
        const privacyCheck = await client.query(
            'SELECT travel_buddy_requests_enabled FROM user_profiles WHERE user_id = $1',
            [targetUserId]
        );

        if (privacyCheck.rows.length > 0 && !privacyCheck.rows[0].travel_buddy_requests_enabled) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                message: 'This user is not accepting buddy requests'
            });
        }

        // Create buddy request
        const insertResult = await client.query(
            `INSERT INTO travel_buddy_connections (requester_id, requested_id, request_message, status)
                VALUES ($1, $2, $3, $4)
                RETURNING id, requester_id, requested_id, request_message, status, requested_at`,
            [requesterId, targetUserId, message || null, 'pending']
        );

        const buddyRequest = insertResult.rows[0];

        // Get requester info for notification
        const requesterInfo = await client.query(
            'SELECT username, full_name FROM users WHERE id = $1',
            [requesterId]
        );

        // Create notification for target user
        await createNotification(client, {
            userId: targetUserId,
            title: 'New Buddy Request',
            message: `${requesterInfo.rows[0].full_name} (@${requesterInfo.rows[0].username}) sent you a buddy request`,
            notificationType: 'buddy_request',
            relatedId: buddyRequest.id,
            relatedUserId: requesterId,
            actionUrl: `/buddies`
        });

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Buddy request sent successfully',
            data: {
                request: buddyRequest
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Send buddy request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send buddy request'
        });
    } finally {
        client.release();
    }
};

// Get all buddy requests (received)
export const getReceivedBuddyRequests = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            `SELECT 
                tbc.id,
                tbc.requester_id,
                tbc.request_message,
                tbc.status,
                tbc.requested_at,
                u.username,
                u.full_name,
                up.profile_photo_url
                    FROM travel_buddy_connections tbc
                    JOIN users u ON tbc.requester_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE tbc.requested_id = $1 AND tbc.status = $2
                    ORDER BY tbc.requested_at DESC`,
            [userId, 'pending']
        );

        res.json({
            success: true,
            data: {
                requests: result.rows
            }
        });

    } catch (error) {
        console.error('Get buddy requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch buddy requests'
        });
    }
};

// Get sent buddy requests
export const getSentBuddyRequests = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            `SELECT 
                tbc.id,
                tbc.requested_id,
                tbc.request_message,
                tbc.status,
                tbc.requested_at,
                u.username,
                u.full_name,
                up.profile_photo_url
                FROM travel_buddy_connections tbc
                JOIN users u ON tbc.requested_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE tbc.requester_id = $1 AND tbc.status = $2
                ORDER BY tbc.requested_at DESC`,
            [userId, 'pending']
        );

        res.json({
            success: true,
            data: {
                requests: result.rows
            }
        });

    } catch (error) {
        console.error('Get sent buddy requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sent buddy requests'
        });
    }
};

// Accept buddy request
export const acceptBuddyRequest = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { requestId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await client.query('BEGIN');

        // Get buddy request
        const requestResult = await client.query(
            'SELECT * FROM travel_buddy_connections WHERE id = $1 AND requested_id = $2 AND status = $3',
            [requestId, userId, 'pending']
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Buddy request not found'
            });
        }

        const buddyRequest = requestResult.rows[0];

        // Update request status
        await client.query(
            'UPDATE travel_buddy_connections SET status = $1, responded_at = NOW() WHERE id = $2',
            ['accepted', requestId]
        );

        // Get user info for notification
        const userInfo = await client.query(
            'SELECT username, full_name FROM users WHERE id = $1',
            [userId]
        );

        // Create notification for requester
        await createNotification(client, {
            userId: buddyRequest.requester_id,
            title: 'Buddy Request Accepted',
            message: `${userInfo.rows[0].full_name} (@${userInfo.rows[0].username}) accepted your buddy request`,
            notificationType: 'buddy_accepted',
            relatedId: parseInt(requestId),
            relatedUserId: userId,
            actionUrl: `/buddies`
        });

        await client.query('COMMIT');

        // Check achievements for both users after buddy connection
        const { checkAndAwardAchievements } = require('./achievements');
        await checkAndAwardAchievements(userId, 'travel_buddies_connected');
        await checkAndAwardAchievements(buddyRequest.requester_id, 'travel_buddies_connected');

        res.json({
            success: true,
            message: 'Buddy request accepted'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Accept buddy request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept buddy request'
        });
    } finally {
        client.release();
    }
};

// Decline buddy request
export const declineBuddyRequest = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { requestId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await client.query('BEGIN');

        // Get buddy request
        const requestResult = await client.query(
            'SELECT * FROM travel_buddy_connections WHERE id = $1 AND requested_id = $2 AND status = $3',
            [requestId, userId, 'pending']
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Buddy request not found'
            });
        }

        // Update request status
        await client.query(
            'UPDATE travel_buddy_connections SET status = $1, responded_at = NOW() WHERE id = $2',
            ['declined', requestId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Buddy request declined'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Decline buddy request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decline buddy request'
        });
    } finally {
        client.release();
    }
};

// Cancel sent buddy request
export const cancelBuddyRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Delete buddy request
        const result = await pool.query(
            'DELETE FROM travel_buddy_connections WHERE id = $1 AND requester_id = $2 AND status = $3 RETURNING id',
            [requestId, userId, 'pending']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Buddy request not found or already processed'
            });
        }

        res.json({
            success: true,
            message: 'Buddy request cancelled'
        });

    } catch (error) {
        console.error('Cancel buddy request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel buddy request'
        });
    }
};

// Get all buddies (accepted connections)
export const getBuddies = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            `SELECT 
                u.id,
                u.username,
                u.full_name,
                u.bio,
                u.current_location,
                up.profile_photo_url,
                tbc.requested_at as connected_at
                FROM travel_buddy_connections tbc
                JOIN users u ON (
                CASE 
                    WHEN tbc.requester_id = $1 THEN u.id = tbc.requested_id
                    ELSE u.id = tbc.requester_id
                END
                )
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE (tbc.requester_id = $1 OR tbc.requested_id = $1) 
                AND tbc.status = $2
                ORDER BY tbc.responded_at DESC`,
            [userId, 'accepted']
        );

        res.json({
            success: true,
            data: {
                buddies: result.rows
            }
        });

    } catch (error) {
        console.error('Get buddies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch buddies'
        });
    }
};

// Remove buddy (unfriend)
export const removeBuddy = async (req: Request, res: Response) => {
    try {
        const { buddyId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Delete buddy connection
        const result = await pool.query(
            `DELETE FROM travel_buddy_connections 
                WHERE ((requester_id = $1 AND requested_id = $2) OR (requester_id = $2 AND requested_id = $1))
                AND status = $3
                RETURNING id`,
            [userId, buddyId, 'accepted']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Buddy connection not found'
            });
        }

        res.json({
            success: true,
            message: 'Buddy removed successfully'
        });

    } catch (error) {
        console.error('Remove buddy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove buddy'
        });
    }
};

// Block user
export const blockUser = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { targetUserId } = req.body;
        const blockerId = req.user?.userId;

        if (!blockerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!targetUserId || blockerId === targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target user'
            });
        }

        await client.query('BEGIN');

        // Check if block already exists
        const existingBlock = await client.query(
            'SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
            [blockerId, targetUserId]
        );

        if (existingBlock.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'User is already blocked'
            });
        }

        // Create block
        await client.query(
            'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2)',
            [blockerId, targetUserId]
        );

        // Remove any existing buddy connections
        await client.query(
            `DELETE FROM travel_buddy_connections 
                WHERE (requester_id = $1 AND requested_id = $2) OR (requester_id = $2 AND requested_id = $1)`,
            [blockerId, targetUserId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'User blocked successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Block user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to block user'
        });
    } finally {
        client.release();
    }
};

// Unblock user
export const unblockUser = async (req: Request, res: Response) => {
    try {
        const { targetUserId } = req.params;
        const blockerId = req.user?.userId;

        if (!blockerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Delete block
        const result = await pool.query(
            'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING id',
            [blockerId, targetUserId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Block not found'
            });
        }

        res.json({
            success: true,
            message: 'User unblocked successfully'
        });

    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unblock user'
        });
    }
};

// Get blocked users
export const getBlockedUsers = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            `SELECT 
                u.id,
                u.username,
                u.full_name,
                up.profile_photo_url,
                ub.blocked_at
                FROM user_blocks ub
                JOIN users u ON ub.blocked_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE ub.blocker_id = $1
                ORDER BY ub.blocked_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                blockedUsers: result.rows
            }
        });

    } catch (error) {
        console.error('Get blocked users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch blocked users'
        });
    }
};

// Check buddy status with another user
export const checkBuddyStatus = async (req: Request, res: Response) => {
    try {
        const { targetUserId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Check for buddy connection
        const connectionResult = await pool.query(
            `SELECT id, status, requester_id, requested_id 
                FROM travel_buddy_connections 
                WHERE (requester_id = $1 AND requested_id = $2) OR (requester_id = $2 AND requested_id = $1)`,
            [userId, targetUserId]
        );

        // Check if blocked
        const blockResult = await pool.query(
            'SELECT id FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
            [userId, targetUserId]
        );

        const isBlocked = blockResult.rows.length > 0;

        let buddyStatus = 'none';
        let requestDirection = null;

        if (connectionResult.rows.length > 0) {
            const connection = connectionResult.rows[0];
            buddyStatus = connection.status;

            if (connection.status === 'pending') {
                requestDirection = connection.requester_id === userId ? 'sent' : 'received';
            }
        }

        res.json({
            success: true,
            data: {
                status: buddyStatus,
                requestDirection,
                isBlocked
            }
        });

    } catch (error) {
        console.error('Check buddy status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check buddy status'
        });
    }
};

// Report user (for admin review later)
export const reportUser = async (req: Request, res: Response) => {
    try {
        const { targetUserId, reportReason, description } = req.body;
        const reporterId = req.user?.userId;

        if (!reporterId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!targetUserId || !reportReason) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create content report
        await pool.query(
            `INSERT INTO content_reports (reporter_id, reported_content_type, reported_content_id, report_reason, description)
                VALUES ($1, $2, $3, $4, $5)`,
            [reporterId, 'user', targetUserId, reportReason, description || null]
        );

        res.json({
            success: true,
            message: 'User reported successfully. Our team will review this report.'
        });

    } catch (error) {
        console.error('Report user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report user'
        });
    }
};

// Find users to connect with (for buddies page)
export const findBuddies = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { 
            search, 
            city, 
            interests, 
            travelStyle, 
            activityLevel,
            page = 1, 
            limit = 20 
        } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const offset = (Number(page) - 1) * Number(limit);

        // Build query
        let queryText = `
            SELECT DISTINCT
                u.id,
                u.username,
                u.full_name,
                u.bio,
                u.current_location,
                u.hometown,
                up.profile_photo_url,
                up.cities_visited,
                tp.travel_style,
                tp.activity_level,
                tp.preferred_difficulty,
                (
                    SELECT json_agg(json_build_object('id', rc.id, 'name', rc.name))
                    FROM user_interests ui
                    INNER JOIN recommendation_categories rc ON ui.category_id = rc.id
                    WHERE ui.user_id = u.id
                ) as interests,
                (
                    SELECT COUNT(*)::int
                    FROM travel_buddy_connections tbc
                    WHERE (tbc.requester_id = u.id OR tbc.requested_id = u.id)
                    AND tbc.status = 'accepted'
                ) as buddies_count,
                (
                    SELECT COUNT(*)::int
                    FROM recommendations r
                    WHERE r.user_id = u.id AND r.status = 'active'
                ) as recommendations_count,
                (
                    SELECT tbc.status
                    FROM travel_buddy_connections tbc
                    WHERE ((tbc.requester_id = $1 AND tbc.requested_id = u.id)
                        OR (tbc.requested_id = $1 AND tbc.requester_id = u.id))
                    LIMIT 1
                ) as buddy_status
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN travel_preferences tp ON u.id = tp.user_id
            WHERE u.id != $1
            AND u.account_status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM user_blocks ub
                WHERE (ub.blocker_id = $1 AND ub.blocked_id = u.id)
                OR (ub.blocker_id = u.id AND ub.blocked_id = $1)
            )
        `;

        const queryParams: any[] = [userId];
        let paramIndex = 2;

        // Add search filter
        if (search) {
            queryText += ` AND (
                u.full_name ILIKE $${paramIndex} 
                OR u.username ILIKE $${paramIndex}
                OR u.bio ILIKE $${paramIndex}
                OR u.current_location ILIKE $${paramIndex}
            )`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Add city filter
        if (city) {
            queryText += ` AND up.cities_visited @> $${paramIndex}::jsonb`;
            queryParams.push(JSON.stringify([city]));
            paramIndex++;
        }

        // Add interests filter
        if (interests) {
            const interestsArray = typeof interests === 'string' ? [interests] : interests;
            queryText += ` AND EXISTS (
                SELECT 1 FROM user_interests ui
                INNER JOIN recommendation_categories rc ON ui.category_id = rc.id
                WHERE ui.user_id = u.id AND rc.name = ANY($${paramIndex})
            )`;
            queryParams.push(interestsArray);
            paramIndex++;
        }

        // Add travel style filter
        if (travelStyle) {
            queryText += ` AND tp.travel_style = $${paramIndex}`;
            queryParams.push(travelStyle);
            paramIndex++;
        }

        // Add activity level filter
        if (activityLevel) {
            queryText += ` AND tp.activity_level = $${paramIndex}`;
            queryParams.push(activityLevel);
            paramIndex++;
        }

        queryText += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(Number(limit), offset);

        const result = await pool.query(queryText, queryParams);

        // Get total count
        let countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN travel_preferences tp ON u.id = tp.user_id
            WHERE u.id != $1
            AND u.account_status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM user_blocks ub
                WHERE (ub.blocker_id = $1 AND ub.blocked_id = u.id)
                OR (ub.blocker_id = u.id AND ub.blocked_id = $1)
            )
        `;

        const countParams: any[] = [userId];
        let countParamIndex = 2;

        if (search) {
            countQuery += ` AND (
                u.full_name ILIKE $${countParamIndex} 
                OR u.username ILIKE $${countParamIndex}
                OR u.bio ILIKE $${countParamIndex}
                OR u.current_location ILIKE $${countParamIndex}
            )`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        if (city) {
            countQuery += ` AND up.cities_visited @> $${countParamIndex}::jsonb`;
            countParams.push(JSON.stringify([city]));
            countParamIndex++;
        }

        if (interests) {
            const interestsArray = typeof interests === 'string' ? [interests] : interests;
            countQuery += ` AND EXISTS (
                SELECT 1 FROM user_interests ui
                INNER JOIN recommendation_categories rc ON ui.category_id = rc.id
                WHERE ui.user_id = u.id AND rc.name = ANY($${countParamIndex})
            )`;
            countParams.push(interestsArray);
            countParamIndex++;
        }

        if (travelStyle) {
            countQuery += ` AND tp.travel_style = $${countParamIndex}`;
            countParams.push(travelStyle);
            countParamIndex++;
        }

        if (activityLevel) {
            countQuery += ` AND tp.activity_level = $${countParamIndex}`;
            countParams.push(activityLevel);
            countParamIndex++;
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        console.error('Find buddies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find buddies'
        });
    }
};

// Discover buddies with network-based ordering (friends-of-friends first)
export const discoverBuddies = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { 
            search, 
            page = 1, 
            limit = 20 
        } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const offset = (Number(page) - 1) * Number(limit);

        // Complex query that orders users by connection level:
        // 1. Friends of friends (mutual connections) - highest priority
        // 2. Unknown users - lower priority
        let queryText = `
            WITH user_buddies AS (
                -- Get all current user's buddies
                SELECT 
                    CASE 
                        WHEN requester_id = $1 THEN requested_id
                        ELSE requester_id
                    END as buddy_id
                FROM travel_buddy_connections
                WHERE (requester_id = $1 OR requested_id = $1)
                AND status = 'accepted'
            ),
            friends_of_friends AS (
                -- Get friends of friends (people connected to user's buddies)
                SELECT 
                    CASE 
                        WHEN tbc.requester_id = ub.buddy_id THEN tbc.requested_id
                        ELSE tbc.requester_id
                    END as user_id,
                    COUNT(DISTINCT ub.buddy_id) as mutual_connections
                FROM user_buddies ub
                INNER JOIN travel_buddy_connections tbc 
                    ON (tbc.requester_id = ub.buddy_id OR tbc.requested_id = ub.buddy_id)
                WHERE tbc.status = 'accepted'
                AND CASE 
                    WHEN tbc.requester_id = ub.buddy_id THEN tbc.requested_id
                    ELSE tbc.requester_id
                END != $1
                AND CASE 
                    WHEN tbc.requester_id = ub.buddy_id THEN tbc.requested_id
                    ELSE tbc.requester_id
                END NOT IN (SELECT buddy_id FROM user_buddies)
                GROUP BY user_id
            )
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.bio,
                u.current_location,
                u.hometown,
                up.profile_photo_url,
                up.cities_visited,
                COALESCE(fof.mutual_connections, 0) as mutual_connections,
                (
                    SELECT COUNT(*)::int
                    FROM travel_buddy_connections tbc
                    WHERE (tbc.requester_id = u.id OR tbc.requested_id = u.id)
                    AND tbc.status = 'accepted'
                ) as buddies_count,
                (
                    SELECT COUNT(*)::int
                    FROM recommendations r
                    WHERE r.user_id = u.id AND r.status = 'active'
                ) as recommendations_count,
                (
                    SELECT tbc.status
                    FROM travel_buddy_connections tbc
                    WHERE ((tbc.requester_id = $1 AND tbc.requested_id = u.id)
                        OR (tbc.requested_id = $1 AND tbc.requester_id = u.id))
                    LIMIT 1
                ) as buddy_status,
                -- Add connection level for ordering
                CASE 
                    WHEN fof.user_id IS NOT NULL THEN 1  -- Friends of friends
                    ELSE 2                                -- Unknown users
                END as connection_level,
                u.created_at
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN friends_of_friends fof ON u.id = fof.user_id
            WHERE u.id != $1
            AND u.account_status = 'active'
            AND u.id NOT IN (SELECT buddy_id FROM user_buddies)
            AND NOT EXISTS (
                SELECT 1 FROM user_blocks ub
                WHERE (ub.blocker_id = $1 AND ub.blocked_id = u.id)
                OR (ub.blocker_id = u.id AND ub.blocked_id = $1)
            )
            AND NOT EXISTS (
                SELECT 1 FROM travel_buddy_connections tbc
                WHERE ((tbc.requester_id = $1 AND tbc.requested_id = u.id)
                    OR (tbc.requested_id = $1 AND tbc.requester_id = u.id))
                AND tbc.status IN ('pending', 'accepted')
            )
        `;

        const queryParams: any[] = [userId];
        let paramIndex = 2;

        // Add search filter
        if (search) {
            queryText += ` AND (
                u.full_name ILIKE $${paramIndex} 
                OR u.username ILIKE $${paramIndex}
                OR u.bio ILIKE $${paramIndex}
                OR u.current_location ILIKE $${paramIndex}
            )`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Order by: connection_level (friends of friends first), then by mutual connections count, then by creation date
        queryText += ` ORDER BY 
            connection_level ASC, 
            mutual_connections DESC NULLS LAST,
            u.created_at DESC 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(Number(limit), offset);

        const result = await pool.query(queryText, queryParams);

        // Get total count
        let countQuery = `
            WITH user_buddies AS (
                SELECT 
                    CASE 
                        WHEN requester_id = $1 THEN requested_id
                        ELSE requester_id
                    END as buddy_id
                FROM travel_buddy_connections
                WHERE (requester_id = $1 OR requested_id = $1)
                AND status = 'accepted'
            )
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            WHERE u.id != $1
            AND u.account_status = 'active'
            AND u.id NOT IN (SELECT buddy_id FROM user_buddies)
            AND NOT EXISTS (
                SELECT 1 FROM user_blocks ub
                WHERE (ub.blocker_id = $1 AND ub.blocked_id = u.id)
                OR (ub.blocker_id = u.id AND ub.blocked_id = $1)
            )
            AND NOT EXISTS (
                SELECT 1 FROM travel_buddy_connections tbc
                WHERE ((tbc.requester_id = $1 AND tbc.requested_id = u.id)
                    OR (tbc.requested_id = $1 AND tbc.requester_id = u.id))
                AND tbc.status IN ('pending', 'accepted')
            )
        `;

        const countParams: any[] = [userId];
        let countParamIndex = 2;

        if (search) {
            countQuery += ` AND (
                u.full_name ILIKE $${countParamIndex} 
                OR u.username ILIKE $${countParamIndex}
                OR u.bio ILIKE $${countParamIndex}
                OR u.current_location ILIKE $${countParamIndex}
            )`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        // Fetch interests separately for each user to avoid DISTINCT ON conflicts
        const usersWithInterests = await Promise.all(
            result.rows.map(async (user) => {
                const interestsResult = await pool.query(
                    `SELECT json_agg(json_build_object('id', rc.id, 'name', rc.name)) as interests
                     FROM user_interests ui
                     INNER JOIN recommendation_categories rc ON ui.category_id = rc.id
                     WHERE ui.user_id = $1`,
                    [user.id]
                );
                return {
                    ...user,
                    interests: interestsResult.rows[0]?.interests || null
                };
            })
        );

        res.json({
            success: true,
            data: {
                users: usersWithInterests,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error) {
        console.error('Discover buddies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to discover buddies'
        });
    }
};
