import { Request, Response } from 'express';
import pool from '../lib/database';

/**
 * Get personalized feed for dashboard
 * Simplified version - shows all recommendations
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
        const totalLimit = Number(limit);

        // Get recommendations
        const recommendationsQuery = `
            SELECT 
                r.id,
                r.title,
                r.description,
                r.user_rating,
                r.likes_count,
                (SELECT COUNT(*)::integer FROM recommendation_saves WHERE recommendation_id = r.id) as shares_count,
                r.views_count,
                r.created_at,
                u.id as user_id,
                u.username,
                u.full_name,
                up.profile_photo_url as profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                'recommendation' as content_type,
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
            LIMIT $2
        `;

        // Get trips based on privacy settings
        const tripsQuery = `
            SELECT 
                t.id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.status,
                t.privacy,
                t.cover_photo_url,
                t.created_at,
                t.user_id,
                u.username as creator_username,
                u.full_name as creator_name,
                up.profile_photo_url as creator_photo,
                'trip' as content_type,
                (SELECT COUNT(*) FROM trip_companions WHERE trip_id = t.id AND status = 'accepted') as companions_count,
                (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'country', c.country))
                 FROM trip_cities tc
                 JOIN cities c ON tc.city_id = c.id
                 WHERE tc.trip_id = t.id) as cities
            FROM trips t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE 
                (
                    -- Public trips: everyone can see
                    t.privacy = 'public'
                    OR
                    -- Buddies only: must be a buddy or companion
                    (t.privacy = 'buddies_only' AND (
                        t.user_id = $1
                        OR EXISTS (
                            SELECT 1 FROM travel_buddy_connections
                            WHERE ((requester_id = $1 AND requested_id = t.user_id) 
                                OR (requester_id = t.user_id AND requested_id = $1))
                            AND status = 'accepted'
                        )
                        OR EXISTS (
                            SELECT 1 FROM trip_companions
                            WHERE trip_id = t.id AND user_id = $1
                        )
                    ))
                    OR
                    -- Private: only owner can see
                    (t.privacy = 'private' AND t.user_id = $1)
                )
            ORDER BY t.created_at DESC
            LIMIT $2
        `;

        const [recommendationsResult, tripsResult] = await Promise.all([
            pool.query(recommendationsQuery, [userId, totalLimit]),
            pool.query(tripsQuery, [userId, Math.floor(totalLimit / 2)])
        ]);

        // Combine and sort by created_at
        const combinedResults = [
            ...recommendationsResult.rows,
            ...tripsResult.rows
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, totalLimit);

        res.status(200).json({
            success: true,
            data: combinedResults,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: combinedResults.length,
                hasMore: combinedResults.length >= totalLimit
            },
            debug: {
                recommendationsCount: recommendationsResult.rows.length,
                tripsCount: tripsResult.rows.length,
                totalCount: combinedResults.length
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

/**
 * Get trending recommendations
 * GET /api/feed/trending
 */
export const getTrendingRecommendations = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 10, days = 7 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const query = `
            SELECT 
                r.id,
                r.title,
                r.description,
                r.user_rating,
                r.likes_count,
                (SELECT COUNT(*)::integer FROM recommendation_saves WHERE recommendation_id = r.id) as shares_count,
                r.views_count,
                r.created_at,
                u.id as user_id,
                u.username,
                u.full_name,
                up.profile_photo_url as profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                COALESCE(
                    (SELECT array_agg(rp.photo_url ORDER BY rp.is_primary DESC) 
                        FROM recommendation_photos rp 
                        WHERE rp.recommendation_id = r.id), 
                    ARRAY[]::varchar[]
                ) as photos,
                (r.likes_count * 2 + COALESCE((SELECT COUNT(*) FROM recommendation_saves WHERE recommendation_id = r.id), 0) * 3 + r.views_count * 0.1) as engagement_score
                ${userId ? `, EXISTS(
                    SELECT 1 FROM recommendation_likes rl 
                    WHERE rl.recommendation_id = r.id AND rl.user_id = $1
                ) as is_liked,
                EXISTS(
                    SELECT 1 FROM recommendation_saves rs 
                    WHERE rs.recommendation_id = r.id AND rs.user_id = $1
                ) as is_bookmarked` : ''}
            FROM recommendations r
            JOIN users u ON r.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_city ON r.id = rec_city.recommendation_id
            LEFT JOIN cities c ON rec_city.city_id = c.id
            WHERE r.status = 'active'
            AND r.created_at >= NOW() - INTERVAL '${Number(days)} days'
            ORDER BY engagement_score DESC, r.created_at DESC
            LIMIT $${userId ? 2 : 1} OFFSET $${userId ? 3 : 2}
        `;

        const params = userId ? [userId, Number(limit), offset] : [Number(limit), offset];
        const result = await pool.query(query, params);

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get trending error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trending recommendations'
        });
    }
};

/**
 * Get active buddies with their latest activity
 * GET /api/feed/active-buddies
 */
export const getActiveBuddies = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { limit = 10 } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await pool.query(
            `SELECT DISTINCT
                u.id,
                u.username,
                u.full_name,
                up.profile_photo_url as profile_picture_url,
                (
                    SELECT created_at 
                    FROM recommendations 
                    WHERE user_id = u.id AND status = 'active'
                    ORDER BY created_at DESC 
                    LIMIT 1
                ) as last_active
            FROM users u
            JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id IN (
                SELECT requested_id FROM travel_buddy_connections WHERE requester_id = $1 AND status = 'accepted'
                UNION
                SELECT requester_id FROM travel_buddy_connections WHERE requested_id = $1 AND status = 'accepted'
            )
            ORDER BY last_active DESC NULLS LAST
            LIMIT $2`,
            [userId, Number(limit)]
        );

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get active buddies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get active buddies'
        });
    }
};
