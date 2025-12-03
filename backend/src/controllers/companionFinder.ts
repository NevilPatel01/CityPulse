import { Request, Response } from 'express';
import pool from '../lib/database';

/**
 * Companion Finder Controllers
 * Helps users find travel buddies and discover public trips
 */

// Find travel companions planning similar trips
export const findTravelCompanions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { city_id, start_date, end_date, limit = 20 } = req.query;

        let query = `
            SELECT 
                u.id,
                u.username,
                u.full_name,
                up.profile_photo_url,
                up.cities_visited,
                t.id as trip_id,
                t.title as trip_title,
                t.start_date,
                t.end_date,
                t.privacy,
                (SELECT COUNT(*) FROM trip_companions WHERE trip_id = t.id AND status = 'accepted') as companions_count,
                (SELECT json_agg(json_build_object(
                    'name', c.name,
                    'country', c.country
                ) ORDER BY tc2.visit_order)
                FROM trip_cities tc2
                JOIN cities c ON tc2.city_id = c.id
                WHERE tc2.trip_id = t.id
                ) as cities,
                -- Check if already connected as buddies
                (SELECT status FROM travel_buddy_connections 
                    WHERE ((requester_id = $1 AND requested_id = u.id) OR (requester_id = u.id AND requested_id = $1))
                    LIMIT 1) as buddy_status,
                -- Check if already invited to this trip
                (SELECT status FROM trip_companions 
                    WHERE trip_id = t.id AND user_id = $1
                    LIMIT 1) as trip_companion_status
            FROM trips t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE t.user_id != $1
            AND t.status IN ('planning', 'active')
            AND (t.privacy = 'public' OR (
                t.privacy = 'buddies_only' AND EXISTS (
                    SELECT 1 FROM travel_buddy_connections tbc
                    WHERE ((tbc.requester_id = $1 AND tbc.requested_id = u.id) OR (tbc.requester_id = u.id AND tbc.requested_id = $1))
                    AND tbc.status = 'accepted'
                )
            ))
        `;

        const params: any[] = [userId];
        let paramCount = 1;

        // Filter by city
        if (city_id) {
            paramCount++;
            query += ` AND EXISTS (
                SELECT 1 FROM trip_cities tc
                WHERE tc.trip_id = t.id AND tc.city_id = $${paramCount}
            )`;
            params.push(city_id);
        }

        // Filter by date range overlap
        if (start_date && end_date) {
            paramCount++;
            query += ` AND t.start_date <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
            query += ` AND t.end_date >= $${paramCount}`;
            params.push(start_date);
        }

        query += ` ORDER BY t.start_date ASC LIMIT $${paramCount + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error finding travel companions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find travel companions'
        });
    }
};

// Discover public trips for inspiration
export const discoverPublicTrips = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { city_id, status = 'completed', limit = 20, offset = 0 } = req.query;

        let query = `
            SELECT 
                t.id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.status,
                t.cover_photo_url,
                t.total_budget,
                t.currency,
                t.created_at,
                u.id as creator_id,
                u.username as creator_username,
                u.full_name as creator_name,
                up.profile_photo_url as creator_photo,
                (SELECT COUNT(*) FROM trip_companions WHERE trip_id = t.id AND status = 'accepted') as companions_count,
                (SELECT COUNT(*) FROM trip_itinerary WHERE trip_id = t.id) as activities_count,
                (SELECT json_agg(json_build_object(
                    'id', c.id,
                    'name', c.name,
                    'country', c.country,
                    'photo_url', c.cover_image_url,
                    'arrival_date', tc.arrival_date,
                    'departure_date', tc.departure_date
                ) ORDER BY tc.visit_order)
                FROM trip_cities tc
                JOIN cities c ON tc.city_id = c.id
                WHERE tc.trip_id = t.id
                ) as cities,
                (SELECT json_agg(json_build_object(
                    'id', r.id,
                    'title', r.title,
                    'photo_url', (SELECT rp.photo_url FROM recommendation_photos rp WHERE rp.recommendation_id = r.id ORDER BY rp.is_primary DESC, rp.created_at LIMIT 1),
                    'category', rc.name
                ) ORDER BY tr.created_at LIMIT 5)
                FROM trip_recommendations tr
                JOIN recommendations r ON tr.recommendation_id = r.id
                LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
                WHERE tr.trip_id = t.id AND tr.status = 'visited'
                ) as highlights
            FROM trips t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE t.privacy = 'public'
            AND t.user_id != $1
        `;

        const params: any[] = [userId];
        let paramCount = 1;

        // Filter by status
        if (status) {
            paramCount++;
            query += ` AND t.status = $${paramCount}`;
            params.push(status);
        }

        // Filter by city
        if (city_id) {
            paramCount++;
            query += ` AND EXISTS (
                SELECT 1 FROM trip_cities WHERE trip_id = t.id AND city_id = $${paramCount}
            )`;
            params.push(city_id);
        }

        query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(DISTINCT t.id) as total
            FROM trips t
            WHERE t.privacy = 'public'
            AND t.user_id != $1
        `;

        const countParams: any[] = [userId];
        let countParamCount = 1;

        if (status) {
            countParamCount++;
            countQuery += ` AND t.status = $${countParamCount}`;
            countParams.push(status);
        }

        if (city_id) {
            countParamCount++;
            countQuery += ` AND EXISTS (
                SELECT 1 FROM trip_cities WHERE trip_id = t.id AND city_id = $${countParamCount}
            )`;
            countParams.push(city_id);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: (parseInt(offset as string) + result.rows.length) < total
            }
        });
    } catch (error) {
        console.error('Error discovering public trips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to discover trips'
        });
    }
};

// Get users planning trips to a specific city
export const getUsersGoingToCity = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { cityId } = req.params;
        const { upcoming_only = 'true', limit = 20 } = req.query;

        let query = `
            SELECT DISTINCT
                u.id,
                u.username,
                u.full_name,
                up.profile_photo_url,
                t.id as trip_id,
                t.title as trip_title,
                t.start_date,
                t.end_date,
                tc.arrival_date,
                tc.departure_date,
                -- Check buddy status
                (SELECT status FROM travel_buddy_connections 
                    WHERE ((requester_id = $1 AND requested_id = u.id) OR (requester_id = u.id AND requested_id = $1))
                    LIMIT 1) as buddy_status
            FROM trip_cities tc
            JOIN trips t ON tc.trip_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE tc.city_id = $2
            AND t.user_id != $1
            AND t.status IN ('planning', 'active')
            AND (t.privacy = 'public' OR (
                t.privacy = 'buddies_only' AND EXISTS (
                    SELECT 1 FROM travel_buddy_connections tbc
                    WHERE ((tbc.requester_id = $1 AND tbc.requested_id = u.id) OR (tbc.requester_id = u.id AND tbc.requested_id = $1))
                    AND tbc.status = 'accepted'
                )
            ))
        `;

        const params: any[] = [userId, cityId];
        let paramCount = 2;

        if (upcoming_only === 'true') {
            query += ` AND t.start_date >= CURRENT_DATE`;
        }

        query += ` ORDER BY t.start_date ASC LIMIT $${paramCount + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting users going to city:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users going to city'
        });
    }
};

// Get suggested trips based on user interests and travel history
export const getSuggestedTrips = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { limit = 10 } = req.query;

        // Get user's interests and visited cities
        const userDataQuery = `
            SELECT 
                (SELECT json_agg(category_id) FROM user_interests WHERE user_id = $1) as interests,
                (SELECT cities_visited FROM user_profiles WHERE user_id = $1) as cities_visited
        `;
        const userData = await pool.query(userDataQuery, [userId]);
        const interests = userData.rows[0]?.interests || [];
        const citiesVisited = userData.rows[0]?.cities_visited || [];

        // Find trips to cities the user hasn't visited yet, with similar interests
        const query = `
            SELECT DISTINCT
                t.id,
                t.title,
                t.description,
                t.start_date,
                t.end_date,
                t.status,
                t.cover_photo_url,
                u.username as creator_username,
                u.full_name as creator_name,
                up.profile_photo_url as creator_photo,
                (SELECT json_agg(json_build_object(
                    'name', c.name,
                    'country', c.country,
                    'photo_url', c.cover_image_url
                ))
                FROM trip_cities tc
                JOIN cities c ON tc.city_id = c.id
                WHERE tc.trip_id = t.id
                ORDER BY tc.visit_order
                ) as cities,
                -- Calculate match score based on interests
                (SELECT COUNT(*) FROM trip_recommendations tr
                    JOIN recommendations r ON tr.recommendation_id = r.id
                    WHERE tr.trip_id = t.id
                    AND r.category_id = ANY($2::int[])
                ) as interest_match_score
            FROM trips t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            JOIN trip_cities tc ON t.id = tc.trip_id
            JOIN cities c ON tc.city_id = c.id
            WHERE t.privacy = 'public'
            AND t.status = 'completed'
            AND t.user_id != $1
            AND NOT (c.id = ANY($3::int[]))
            ORDER BY interest_match_score DESC, t.created_at DESC
            LIMIT $4
        `;

        const result = await pool.query(query, [
            userId,
            interests.length > 0 ? interests : [0],
            citiesVisited.length > 0 ? citiesVisited : [0],
            limit
        ]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting suggested trips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get suggested trips'
        });
    }
};
