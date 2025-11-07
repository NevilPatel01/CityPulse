import { Request, Response } from 'express';
import pool from '../lib/database';

/**
 * Get personalized feed for dashboard
 * Algorithm: 50% from buddies, 30% trending, 20% based on interests
 * Filters by nearby location if provided
 * GET /api/feed
 */
export const getFeed = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const {
            page = 1,
            limit = 10,
            latitude,
            longitude,
            radius = 50 // km
        } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const offset = (Number(page) - 1) * Number(limit);
        const totalLimit = Number(limit);

        // Calculate distribution
        const buddyLimit = Math.ceil(totalLimit * 0.5); // 50%
        const trendingLimit = Math.ceil(totalLimit * 0.3); // 30%
        const interestLimit = totalLimit - buddyLimit - trendingLimit; // 20%

        // Build location filter SQL
        const hasLocation = latitude && longitude;
        const locationFilter = hasLocation ?
            `AND (
                up.latitude IS NOT NULL 
                AND up.longitude IS NOT NULL
                AND (
                    6371 * acos(
                        cos(radians($${hasLocation ? 'LAT_PARAM' : '0'})) * 
                        cos(radians(up.latitude)) * 
                        cos(radians(up.longitude) - radians($${hasLocation ? 'LNG_PARAM' : '0'})) + 
                        sin(radians($${hasLocation ? 'LAT_PARAM' : '0'})) * 
                        sin(radians(up.latitude))
                    )
                ) <= $${hasLocation ? 'RAD_PARAM' : '50'}
            )` : '';

        // Replace placeholders with actual param numbers
        let paramIndex = 2; // userId is $1
        const locationFilterFinal = hasLocation ?
            locationFilter
                .replace(/\$LAT_PARAM/g, `$${paramIndex++}`)
                .replace(/\$LNG_PARAM/g, `$${paramIndex++}`)
                .replace(/\$RAD_PARAM/g, `$${paramIndex++}`)
            : '';

        // Build params array
        const baseParams: any[] = [userId];
        if (hasLocation) {
            baseParams.push(Number(latitude), Number(longitude), Number(radius));
        }

        // ================================================================
        // 1. Get recommendations from buddies (50%)
        // ================================================================
        const buddyParamStart = baseParams.length + 1;
        const buddyRecsQuery = `
            SELECT DISTINCT ON (r.id)
                r.id,
                r.title,
                r.description,
                r.user_rating,
                r.likes_count,
                r.shares_count,
                r.views_count,
                r.created_at,
                u.id as user_id,
                u.username,
                u.full_name,
                up.profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                'buddy' as source,
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
                EXISTS(
                    SELECT 1 FROM recommendation_bookmarks rb 
                    WHERE rb.recommendation_id = r.id AND rb.user_id = $1
                ) as is_bookmarked
            FROM recommendations r
            JOIN users u ON r.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_city ON r.id = rec_city.recommendation_id
            LEFT JOIN cities c ON rec_city.city_id = c.id
            WHERE r.user_id IN (
                SELECT buddy_id FROM buddies WHERE user_id = $1 AND status = 'accepted'
                UNION
                SELECT user_id FROM buddies WHERE buddy_id = $1 AND status = 'accepted'
            )
            AND r.status = 'active'
            ${locationFilterFinal.replace(/\$(\d+)/g, (_, num) => `$${Number(num)}`)}
            ORDER BY r.id, r.created_at DESC
            LIMIT $${buddyParamStart}
        `;

        const buddyRecs = await pool.query(
            buddyRecsQuery,
            [...baseParams, buddyLimit]
        );

        // ================================================================
        // 2. Get trending recommendations (30%)
        // High engagement in last 7 days
        // ================================================================
        const trendingParamStart = buddyParamStart + 1;
        const trendingQuery = `
            SELECT DISTINCT ON (r.id)
                r.id,
                r.title,
                r.description,
                r.user_rating,
                r.likes_count,
                r.shares_count,
                r.views_count,
                r.created_at,
                u.id as user_id,
                u.username,
                u.full_name,
                up.profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                'trending' as source,
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
                EXISTS(
                    SELECT 1 FROM recommendation_bookmarks rb 
                    WHERE rb.recommendation_id = r.id AND rb.user_id = $1
                ) as is_bookmarked,
                (r.likes_count * 2 + r.shares_count * 3 + r.views_count * 0.1) as engagement_score
            FROM recommendations r
            JOIN users u ON r.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_city ON r.id = rec_city.recommendation_id
            LEFT JOIN cities c ON rec_city.city_id = c.id
            WHERE r.status = 'active'
            AND r.created_at >= NOW() - INTERVAL '7 days'
            AND r.id NOT IN (${buddyRecs.rows.map(br => br.id).join(',') || '0'})
            ${locationFilterFinal.replace(/\$(\d+)/g, (_, num) => `$${Number(num)}`)}
            ORDER BY r.id, engagement_score DESC, r.created_at DESC
            LIMIT $${trendingParamStart}
        `;

        const trendingRecs = await pool.query(
            trendingQuery,
            [...baseParams, trendingLimit]
        );

        // ================================================================
        // 3. Get interest-based recommendations (20%)
        // Based on user's selected categories
        // ================================================================
        const interestParamStart = trendingParamStart + 1;
        const excludedIds = [
            ...buddyRecs.rows.map(r => r.id),
            ...trendingRecs.rows.map(r => r.id)
        ];

        const interestQuery = `
            SELECT DISTINCT ON (r.id)
                r.id,
                r.title,
                r.description,
                r.user_rating,
                r.likes_count,
                r.shares_count,
                r.views_count,
                r.created_at,
                u.id as user_id,
                u.username,
                u.full_name,
                up.profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                'interest' as source,
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
                EXISTS(
                    SELECT 1 FROM recommendation_bookmarks rb 
                    WHERE rb.recommendation_id = r.id AND rb.user_id = $1
                ) as is_bookmarked
            FROM recommendations r
            JOIN users u ON r.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_city ON r.id = rec_city.recommendation_id
            LEFT JOIN cities c ON rec_city.city_id = c.id
            WHERE r.status = 'active'
            AND rc.name IN (
                SELECT ic.name FROM user_interests ui 
                JOIN interest_categories ic ON ui.interest_category_id = ic.id 
                WHERE ui.user_id = $1
            )
            AND r.id NOT IN (${excludedIds.join(',') || '0'})
            ${locationFilterFinal.replace(/\$(\d+)/g, (_, num) => `$${Number(num)}`)}
            ORDER BY r.id, r.created_at DESC
            LIMIT $${interestParamStart}
        `;

        const interestRecs = await pool.query(
            interestQuery,
            [...baseParams, interestLimit]
        );

        // ================================================================
        // 4. Combine and shuffle results
        // ================================================================
        const allRecommendations = [
            ...buddyRecs.rows,
            ...trendingRecs.rows,
            ...interestRecs.rows
        ];

        // Shuffle to mix different sources
        const shuffled = allRecommendations
            .sort(() => Math.random() - 0.5)
            .slice(offset, offset + totalLimit);

        // Get total available count (approximate)
        const totalCount = buddyRecs.rows.length + trendingRecs.rows.length + interestRecs.rows.length;

        res.status(200).json({
            success: true,
            data: shuffled,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalCount,
                hasMore: shuffled.length === totalLimit
            },
            debug: {
                buddyCount: buddyRecs.rows.length,
                trendingCount: trendingRecs.rows.length,
                interestCount: interestRecs.rows.length,
                locationFilter: hasLocation
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
                r.shares_count,
                r.views_count,
                r.created_at,
                u.id as user_id,
                u.username,
                u.full_name,
                up.profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                COALESCE(
                    (SELECT array_agg(rp.photo_url ORDER BY rp.is_primary DESC, rp.created_at ASC) 
                     FROM recommendation_photos rp 
                     WHERE rp.recommendation_id = r.id), 
                    ARRAY[]::varchar[]
                ) as photos,
                (r.likes_count * 2 + r.shares_count * 3 + r.views_count * 0.1) as engagement_score
                ${userId ? `, EXISTS(
                    SELECT 1 FROM recommendation_likes rl 
                    WHERE rl.recommendation_id = r.id AND rl.user_id = $1
                ) as is_liked,
                EXISTS(
                    SELECT 1 FROM recommendation_bookmarks rb 
                    WHERE rb.recommendation_id = r.id AND rb.user_id = $1
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
                up.profile_picture_url,
                up.current_city_id,
                c.name as current_city,
                (
                    SELECT created_at 
                    FROM recommendations 
                    WHERE user_id = u.id AND status = 'active'
                    ORDER BY created_at DESC 
                    LIMIT 1
                ) as last_active
            FROM users u
            JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN cities c ON up.current_city_id = c.id
            WHERE u.id IN (
                SELECT buddy_id FROM buddies WHERE user_id = $1 AND status = 'accepted'
                UNION
                SELECT user_id FROM buddies WHERE buddy_id = $1 AND status = 'accepted'
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
