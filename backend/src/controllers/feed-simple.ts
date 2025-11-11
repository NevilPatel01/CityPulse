import { Request, Response } from 'express';
import pool from '../lib/database';

/**
 * Simple feed - just returns all active recommendations
 * GET /api/feed
 */
export const getFeed = async (req: Request, res: Response) => {
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

        const query = `
            SELECT 
                r.id,
                r.title,
                r.description,
                r.user_rating,
                r.likes_count,
                r.saves_count as shares_count,
                r.views_count,
                r.created_at,
                u.id as user_id,
                u.username,
                u.full_name,
                up.profile_photo_url as profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                'general' as source,
                COALESCE(
                    (SELECT array_agg(rp.photo_url ORDER BY rp.is_primary DESC) 
                        FROM recommendation_photos rp 
                        WHERE rp.recommendation_id = r.id), 
                    ARRAY[]::varchar[]
                ) as photos,
                EXISTS(
                    SELECT 1 FROM recommendation_likes rl 
                    WHERE rl.recommendation_id = r.id AND rl.user_id = $1
                ) as is_liked,
                EXISTS(
                    SELECT 1 FROM recommendation_saves rs 
                    WHERE rs.recommendation_id = r.id AND rs.user_id = $1
                ) as is_bookmarked
            FROM recommendations r
            JOIN users u ON r.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_city ON r.id = rec_city.recommendation_id
            LEFT JOIN cities c ON rec_city.city_id = c.id
            WHERE r.status = 'active'
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [userId, Number(limit), offset]);

        res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: result.rows.length,
                hasMore: result.rows.length >= Number(limit)
            },
            debug: {
                buddyCount: 0,
                trendingCount: 0,
                interestCount: result.rows.length,
                locationFilter: false
            }
        });

    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get feed'
        });
    }
};

// Keep other functions from original
export { getTrendingRecommendations, getActiveBuddies } from './feed';
