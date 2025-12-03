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
        const { page = 1, limit = 10, latitude, longitude, radius } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const offset = (Number(page) - 1) * Number(limit);
        const totalLimit = Number(limit);
        const locationFilter = !!(latitude && longitude && radius);
        let paramIndex = 3; // Start after userId ($1) and limit ($2)

        // Get personalized recommendations with scoring
        // Priority: 1. Buddy recommendations (2x), 2. Recent engagement (1.5x), 3. Recent posts (1x)
        let recommendationsQuery = `
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
                ) as is_bookmarked,
                -- Personalized scoring: prioritize buddy content and recent engagement
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM travel_buddy_connections tbc
                        WHERE ((tbc.requester_id = $1 AND tbc.requested_id = r.user_id)
                            OR (tbc.requester_id = r.user_id AND tbc.requested_id = $1))
                        AND tbc.status = 'accepted'
                    ) THEN 2.0
                    ELSE 1.0
                END * 
                CASE 
                    WHEN r.created_at >= NOW() - INTERVAL '7 days' 
                    AND (r.likes_count + r.views_count * 0.1) > 5 
                    THEN 1.5
                    ELSE 1.0
                END as personalization_score,
                -- Source field: buddy, trending, or interest
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM travel_buddy_connections tbc
                        WHERE ((tbc.requester_id = $1 AND tbc.requested_id = r.user_id)
                            OR (tbc.requester_id = r.user_id AND tbc.requested_id = $1))
                        AND tbc.status = 'accepted'
                    ) THEN 'buddy'
                    WHEN r.created_at >= NOW() - INTERVAL '7 days' 
                    AND (r.likes_count * 2 + COALESCE((SELECT COUNT(*) FROM recommendation_saves WHERE recommendation_id = r.id), 0) * 3 + r.views_count * 0.1) > 10
                    THEN 'trending'
                    WHEN EXISTS (
                        SELECT 1 FROM user_interests ui
                        WHERE ui.user_id = $1 AND ui.category_id = r.category_id
                    ) THEN 'interest'
                    ELSE 'trending'
                END as source
            FROM recommendations r
            JOIN users u ON r.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_city ON r.id = rec_city.recommendation_id
            LEFT JOIN cities c ON rec_city.city_id = c.id
            WHERE r.status = 'active'
        `;

        const queryParams: any[] = [userId, totalLimit];
        
        if (locationFilter) {
            recommendationsQuery += ` AND (
                c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND
                (6371 * acos(
                    cos(radians($${paramIndex})) * 
                    cos(radians(c.latitude)) * 
                    cos(radians(c.longitude) - radians($${paramIndex + 1})) + 
                    sin(radians($${paramIndex})) * 
                    sin(radians(c.latitude))
                )) <= $${paramIndex + 2}
            )`;
            queryParams.push(Number(latitude), Number(longitude), Number(radius));
        }

        recommendationsQuery += `
            ORDER BY 
                personalization_score DESC,
                r.created_at DESC
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
            pool.query(recommendationsQuery, queryParams),
            pool.query(tripsQuery, [userId, Math.floor(totalLimit / 2)])
        ]);

        // Combine and sort by personalization score and created_at
        const combinedResults = [
            ...recommendationsResult.rows,
            ...tripsResult.rows
        ].sort((a, b) => {
            // First sort by personalization score if available
            const scoreA = a.personalization_score || 1.0;
            const scoreB = b.personalization_score || 1.0;
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }
            // Then by created_at
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
         .slice(0, totalLimit);

        // Count sources for debug info
        const buddyCount = combinedResults.filter((r: any) => r.source === 'buddy').length;
        const trendingCount = combinedResults.filter((r: any) => r.source === 'trending').length;
        const interestCount = combinedResults.filter((r: any) => r.source === 'interest').length;

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
                totalCount: combinedResults.length,
                buddyCount,
                trendingCount,
                interestCount,
                locationFilter
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

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM recommendations r
            WHERE r.status = 'active'
            AND r.created_at >= NOW() - INTERVAL '${Number(days)} days'
        `;
        const countResult = await pool.query(countQuery);
        const total = parseInt(countResult.rows[0].total);

        res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                hasMore: offset + result.rows.length < total
            }
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

/**
 * Get top places this month (last 30 days)
 * GET /api/feed/top-places-month
 */
export const getTopPlacesThisMonth = async (req: Request, res: Response) => {
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
                (r.likes_count * 2 + COALESCE((SELECT COUNT(*) FROM recommendation_saves WHERE recommendation_id = r.id), 0) * 3 + r.views_count * 0.1) as engagement_score,
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
            AND r.created_at >= NOW() - INTERVAL '30 days'
            ORDER BY engagement_score DESC, r.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [userId, Number(limit), offset]);

        res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get top places this month error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get top places this month'
        });
    }
};

/**
 * Get popular recommendations in user's current country
 * GET /api/feed/popular-country
 */
export const getPopularInCountry = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 10 } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Get user's current location
        const userLocationResult = await pool.query(
            `SELECT up.current_location 
             FROM user_profiles up 
             WHERE up.user_id = $1`,
            [userId]
        );

        const currentLocation = userLocationResult.rows[0]?.current_location;
        if (!currentLocation) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // Extract country from location string (format: "City, Country")
        const countryMatch = currentLocation.match(/,\s*([^,]+)$/);
        if (!countryMatch) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const country = countryMatch[1].trim();
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
                'recommendation' as content_type,
                COALESCE(
                    (SELECT array_agg(rp.photo_url ORDER BY rp.is_primary DESC) 
                        FROM recommendation_photos rp 
                        WHERE rp.recommendation_id = r.id), 
                    ARRAY[]::varchar[]
                ) as photos,
                (r.likes_count * 2 + COALESCE((SELECT COUNT(*) FROM recommendation_saves WHERE recommendation_id = r.id), 0) * 3 + r.views_count * 0.1) as engagement_score,
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
            AND c.country = $2
            ORDER BY engagement_score DESC, r.created_at DESC
            LIMIT $3 OFFSET $4
        `;

        const result = await pool.query(query, [userId, country, Number(limit), offset]);

        res.status(200).json({
            success: true,
            data: result.rows,
            meta: {
                country
            }
        });

    } catch (error) {
        console.error('Get popular in country error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get popular recommendations in country'
        });
    }
};

/**
 * Get mixed activity from travel buddies (recommendations + trips)
 * GET /api/feed/buddies-activity
 */
export const getBuddiesActivity = async (req: Request, res: Response) => {
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

        // Get buddy IDs
        const buddiesResult = await pool.query(
            `SELECT 
                CASE 
                    WHEN requester_id = $1 THEN requested_id 
                    ELSE requester_id 
                END as buddy_id
             FROM travel_buddy_connections 
             WHERE (requester_id = $1 OR requested_id = $1) 
             AND status = 'accepted'`,
            [userId]
        );

        const buddyIds = buddiesResult.rows.map(row => row.buddy_id);
        
        if (buddyIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // Get recommendations from buddies
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
            AND r.user_id = ANY($2::int[])
            ORDER BY r.created_at DESC
            LIMIT $3
        `;

        // Get trips from buddies (public or buddies_only)
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
            WHERE t.user_id = ANY($1::int[])
            AND (
                t.privacy = 'public'
                OR (t.privacy = 'buddies_only' AND (
                    t.user_id = $2
                    OR EXISTS (
                        SELECT 1 FROM travel_buddy_connections
                        WHERE ((requester_id = $2 AND requested_id = t.user_id) 
                            OR (requester_id = t.user_id AND requested_id = $2))
                        AND status = 'accepted'
                    )
                ))
            )
            ORDER BY t.created_at DESC
            LIMIT $3
        `;

        const [recommendationsResult, tripsResult] = await Promise.all([
            pool.query(recommendationsQuery, [userId, buddyIds, Number(limit)]),
            pool.query(tripsQuery, [buddyIds, userId, Math.floor(Number(limit) / 2)])
        ]);

        // Combine and sort by created_at
        const combinedResults = [
            ...recommendationsResult.rows,
            ...tripsResult.rows
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(offset, offset + Number(limit));

        res.status(200).json({
            success: true,
            data: combinedResults
        });

    } catch (error) {
        console.error('Get buddies activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get buddies activity'
        });
    }
};
