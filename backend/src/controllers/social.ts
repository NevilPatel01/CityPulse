import { Request, Response } from 'express';
import pool from '../lib/database';

// ============================================================================
// BOOKMARK ENDPOINTS
// ============================================================================

/**
 * Toggle bookmark for a recommendation
 * POST /api/social/bookmarks/:recommendationId
 */
export const toggleBookmark = async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
        const { recommendationId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await client.query('BEGIN');

        // Check if recommendation exists
        const recommendationCheck = await client.query(
            'SELECT id FROM recommendations WHERE id = $1',
            [recommendationId]
        );

        if (recommendationCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        // Check if bookmark exists
        const existingBookmark = await client.query(
            'SELECT id FROM recommendation_saves WHERE user_id = $1 AND recommendation_id = $2',
            [userId, recommendationId]
        );

        let isBookmarked = false;

        if (existingBookmark.rows.length > 0) {
            // Remove bookmark
            await client.query(
                'DELETE FROM recommendation_saves WHERE user_id = $1 AND recommendation_id = $2',
                [userId, recommendationId]
            );
            isBookmarked = false;
        } else {
            // Add bookmark
            await client.query(
                'INSERT INTO recommendation_saves (user_id, recommendation_id) VALUES ($1, $2)',
                [userId, recommendationId]
            );
            isBookmarked = true;
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: isBookmarked ? 'Recommendation bookmarked' : 'Bookmark removed',
            data: { isBookmarked }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Toggle bookmark error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle bookmark'
        });
    } finally {
        client.release();
    }
};

/**
 * Get user's bookmarked recommendations
 * GET /api/social/bookmarks
 */
export const getBookmarkedRecommendations = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const offset = (Number(page) - 1) * Number(limit);

        const result = await pool.query(
            `SELECT 
                r.id,
                r.title,
                r.description,
                r.user_rating,
                r.likes_count,
                (SELECT COUNT(*)::integer FROM recommendation_saves WHERE recommendation_id = r.id) as shares_count,
                r.views_count,
                r.created_at,
                r.user_id,
                u.username,
                u.full_name,
                up.profile_photo_url as profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                b.created_at as bookmarked_at,
                COALESCE(
                    (SELECT array_agg(rp.photo_url ORDER BY rp.is_primary DESC, rp.created_at ASC) 
                     FROM recommendation_photos rp 
                     WHERE rp.recommendation_id = r.id), 
                    ARRAY[]::varchar[]
                ) as photos,
                EXISTS(
                    SELECT 1 FROM recommendation_likes rl 
                    WHERE rl.recommendation_id = r.id AND rl.user_id = $1
                ) as is_liked,
                true as is_bookmarked,
                'recommendation' as content_type
            FROM recommendation_saves b
            JOIN recommendations r ON b.recommendation_id = r.id
            JOIN users u ON r.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_city ON r.id = rec_city.recommendation_id
            LEFT JOIN cities c ON rec_city.city_id = c.id
            WHERE b.user_id = $1 AND r.status = 'active'
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3`,
            [userId, Number(limit), offset]
        );

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM recommendation_saves WHERE user_id = $1',
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                posts: result.rows,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(countResult.rows[0].total / Number(limit)),
                    totalItems: parseInt(countResult.rows[0].total)
                }
            }
        });

    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get bookmarked recommendations'
        });
    }
};

/**
 * Check if recommendation is bookmarked
 * GET /api/social/bookmarks/:recommendationId/status
 */
export const checkBookmarkStatus = async (req: Request, res: Response) => {
    try {
        const { recommendationId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            'SELECT id FROM recommendation_saves WHERE user_id = $1 AND recommendation_id = $2',
            [userId, recommendationId]
        );

        res.status(200).json({
            success: true,
            data: {
                isBookmarked: result.rows.length > 0
            }
        });

    } catch (error) {
        console.error('Check bookmark status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check bookmark status'
        });
    }
};

// ============================================================================
// SHARE ENDPOINTS
// ============================================================================

/**
 * Record a share
 * POST /api/social/shares/:recommendationId
 */
export const recordShare = async (req: Request, res: Response) => {
    try {
        const { recommendationId } = req.params;
        const { platform } = req.body; // 'twitter', 'facebook', 'whatsapp', 'copy_link', etc.
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await pool.query(
            'INSERT INTO recommendation_shares (recommendation_id, user_id, share_platform) VALUES ($1, $2, $3)',
            [recommendationId, userId, platform || 'unknown']
        );

        res.status(201).json({
            success: true,
            message: 'Share recorded successfully'
        });

    } catch (error) {
        console.error('Record share error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record share'
        });
    }
};

// ============================================================================
// REPORT ENDPOINTS
// ============================================================================

/**
 * Report a recommendation
 * POST /api/social/reports/:recommendationId
 */
export const reportRecommendation = async (req: Request, res: Response) => {
    try {
        const { recommendationId } = req.params;
        const { reason, description } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Validate reason
        const validReasons = ['spam', 'inappropriate', 'misleading', 'offensive', 'copyright', 'other'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report reason'
            });
        }

        // Check if user already reported this recommendation
        const existingReport = await pool.query(
            'SELECT id FROM content_reports WHERE reporter_id = $1 AND reported_content_type = $2 AND reported_content_id = $3',
            [userId, 'recommendation', recommendationId]
        );

        if (existingReport.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this recommendation'
            });
        }

        await pool.query(
            `INSERT INTO content_reports (reporter_id, reported_content_type, reported_content_id, report_reason, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, 'recommendation', recommendationId, reason, description]
        );

        res.status(200).json({
            success: true,
            message: 'Report submitted successfully. Our team will review it.'
        });

    } catch (error) {
        console.error('Report recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report'
        });
    }
};

/**
 * Report a user profile
 * POST /api/social/reports/profile/:userId
 */
export const reportProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { reason, description } = req.body;
        const reporterId = req.user?.userId;

        if (!reporterId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Validate reason
        const validReasons = ['spam', 'inappropriate', 'misleading', 'offensive', 'harassment', 'impersonation', 'other'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report reason'
            });
        }

        // Prevent users from reporting themselves
        if (parseInt(userId) === reporterId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot report your own profile'
            });
        }

        // Check if user exists
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user already reported this profile
        const existingReport = await pool.query(
            'SELECT id FROM content_reports WHERE reporter_id = $1 AND reported_content_type = $2 AND reported_content_id = $3',
            [reporterId, 'profile', userId]
        );

        if (existingReport.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this profile'
            });
        }

        await pool.query(
            `INSERT INTO content_reports (reporter_id, reported_content_type, reported_content_id, report_reason, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [reporterId, 'profile', userId, reason, description]
        );

        res.status(200).json({
            success: true,
            message: 'Report submitted successfully. Our team will review it.'
        });

    } catch (error) {
        console.error('Report profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report'
        });
    }
};

// ============================================================================
// USER INTERESTS ENDPOINTS
// ============================================================================

/**
 * Set user interests (categories they're interested in)
 * POST /api/social/interests
 */
export const setUserInterests = async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
        const { categoryIds } = req.body; // Array of category IDs
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one category'
            });
        }

        await client.query('BEGIN');

        // Delete existing interests
        await client.query(
            'DELETE FROM user_interests WHERE user_id = $1',
            [userId]
        );

        // Insert new interests
        for (const categoryId of categoryIds) {
            await client.query(
                'INSERT INTO user_interests (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, categoryId]
            );
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Interests updated successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Set user interests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update interests'
        });
    } finally {
        client.release();
    }
};

/**
 * Get user interests
 * GET /api/social/interests
 */
export const getUserInterests = async (req: Request, res: Response) => {
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
                ui.id,
                ui.category_id,
                rc.name as category_name,
                rc.description as category_description
            FROM user_interests ui
            JOIN recommendation_categories rc ON ui.category_id = rc.id
            WHERE ui.user_id = $1
            ORDER BY rc.name`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get user interests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user interests'
        });
    }
};

// ============================================================================
// USER STATS ENDPOINT
// ============================================================================

/**
 * Get user statistics for dashboard
 * GET /api/social/stats
 */
export const getUserStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Get recommendations count
        const recsCount = await pool.query(
            'SELECT COUNT(*) as count FROM recommendations WHERE user_id = $1 AND status = $2',
            [userId, 'active']
        );

        // Get cities visited count (unique cities from user's recommendations)
        const citiesCount = await pool.query(
            `SELECT COUNT(DISTINCT c.id) as count
             FROM recommendations r
             JOIN recommendation_cities rc ON r.id = rc.recommendation_id
             JOIN cities c ON rc.city_id = c.id
             WHERE r.user_id = $1 AND r.status = $2`,
            [userId, 'active']
        );

        // Get buddies count (accepted travel buddy connections)
        const buddiesCount = await pool.query(
            `SELECT COUNT(DISTINCT 
                CASE 
                    WHEN requester_id = $1 THEN requested_id
                    WHEN requested_id = $1 THEN requester_id
                END
            ) as count 
            FROM travel_buddy_connections 
            WHERE (requester_id = $1 OR requested_id = $1) AND status = $2`,
            [userId, 'accepted']
        );

        // Get total likes received
        const likesReceived = await pool.query(
            `SELECT SUM(r.likes_count) as total_likes
             FROM recommendations r
             WHERE r.user_id = $1 AND r.status = $2`,
            [userId, 'active']
        );

        // Get total views
        const viewsCount = await pool.query(
            `SELECT SUM(r.views_count) as total_views
             FROM recommendations r
             WHERE r.user_id = $1 AND r.status = $2`,
            [userId, 'active']
        );

        res.status(200).json({
            success: true,
            data: {
                recommendations: parseInt(recsCount.rows[0].count) || 0,
                citiesVisited: parseInt(citiesCount.rows[0].count) || 0,
                buddies: parseInt(buddiesCount.rows[0].count) || 0,
                likesReceived: parseInt(likesReceived.rows[0].total_likes) || 0,
                totalViews: parseInt(viewsCount.rows[0].total_views) || 0
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user statistics'
        });
    }
};
