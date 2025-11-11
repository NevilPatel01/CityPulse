import { Request, Response } from 'express';
import pool from '../lib/database';

// Get city details with all recommendations
export const getCityDetails = async (req: Request, res: Response) => {
    const { cityName } = req.params;
    const { category } = req.query;

    try {
        // Get city information
        const cityResult = await pool.query(
            `SELECT id, name, country, state_province, description, cover_image_url, 
                latitude, longitude, timezone
        FROM cities 
        WHERE LOWER(name) = LOWER($1)`,
            [cityName]
        );

        if (cityResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'City not found'
            });
        }

        const city = cityResult.rows[0];

        // Build recommendations query with optional category filter
        let recommendationsQuery = `
        SELECT 
        r.id,
        r.title,      
        r.description,
        r.user_rating,
        r.price_range_min,
        r.price_range_max,
        r.difficulty_level,
        r.address,
        r.latitude,
        r.longitude,
        r.best_time_to_visit,
        r.duration_suggestion,
        r.views_count,
        r.likes_count,
        r.saves_count,
        r.created_at,
        rc.name as category_name,
        rc.id as category_id,
        u.username as creator_username,
        u.full_name as creator_name,
        up.profile_photo_url as creator_photo,
        (
            SELECT json_agg(json_build_object(
            'id', rp.id,
            'url', rp.photo_url,
            'caption', rp.caption,
            'is_primary', rp.is_primary
            ) ORDER BY rp.is_primary DESC, rp.created_at ASC)
            FROM recommendation_photos rp
            WHERE rp.recommendation_id = r.id
        ) as photos,
        (
            SELECT json_agg(json_build_object(
            'id', rt.id,
            'name', rt.name
            ))
            FROM recommendation_tags rt
            INNER JOIN recommendation_tag_links rtl ON rt.id = rtl.tag_id
            WHERE rtl.recommendation_id = r.id
        ) as tags,
        (
            SELECT COUNT(*)::int
            FROM recommendation_ratings rr
            WHERE rr.recommendation_id = r.id
        ) as ratings_count,
        (
            SELECT COALESCE(AVG(rr.rating), 0)::numeric(3,2)
            FROM recommendation_ratings rr
            WHERE rr.recommendation_id = r.id
        ) as avg_rating
        FROM recommendations r
        INNER JOIN recommendation_cities rci ON r.id = rci.recommendation_id
        INNER JOIN recommendation_categories rc ON r.category_id = rc.id
        INNER JOIN users u ON r.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE rci.city_id = $1 
        AND r.status = 'active'
    `;

        const queryParams: any[] = [city.id];

        if (category && category !== 'all') {
            recommendationsQuery += ` AND rc.name = $2`;
            queryParams.push(category);
        }

        recommendationsQuery += ` ORDER BY r.created_at DESC`;

        const recommendationsResult = await pool.query(recommendationsQuery, queryParams);

        // Get all available categories for this city
        const categoriesResult = await pool.query(
            `SELECT DISTINCT rc.id, rc.name, rc.icon_url, COUNT(r.id)::int as count
        FROM recommendation_categories rc
        INNER JOIN recommendations r ON rc.id = r.category_id
        INNER JOIN recommendation_cities rci ON r.id = rci.recommendation_id
        WHERE rci.city_id = $1 AND r.status = 'active'
        GROUP BY rc.id, rc.name, rc.icon_url
        ORDER BY count DESC, rc.name ASC`,
            [city.id]
        );

        // Get city stats
        const statsResult = await pool.query(
            `SELECT 
        (SELECT COUNT(DISTINCT r.id)::int 
            FROM recommendations r
            INNER JOIN recommendation_cities rci ON r.id = rci.recommendation_id
            WHERE rci.city_id = $1 AND r.status = 'active') as total_recommendations,
        (SELECT COUNT(DISTINCT r.user_id)::int
            FROM recommendations r
            INNER JOIN recommendation_cities rci ON r.id = rci.recommendation_id
            WHERE rci.city_id = $1 AND r.status = 'active') as contributors,
        (SELECT COUNT(*)::int 
            FROM user_city_visits 
            WHERE city_id = $1) as visitors`,
            [city.id]
        );

        res.json({
            success: true,
            data: {
                city: {
                    id: city.id,
                    name: city.name,
                    country: city.country,
                    stateProvince: city.state_province,
                    description: city.description,
                    coverImage: city.cover_image_url,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    timezone: city.timezone,
                    stats: statsResult.rows[0]
                },
                recommendations: recommendationsResult.rows.map(rec => ({
                    id: rec.id,
                    title: rec.title,
                    description: rec.description,
                    userRating: rec.user_rating,
                    priceRange: {
                        min: rec.price_range_min ? parseFloat(rec.price_range_min) : null,
                        max: rec.price_range_max ? parseFloat(rec.price_range_max) : null
                    },
                    difficultyLevel: rec.difficulty_level,
                    address: rec.address,
                    latitude: rec.latitude ? parseFloat(rec.latitude) : null,
                    longitude: rec.longitude ? parseFloat(rec.longitude) : null,
                    bestTimeToVisit: rec.best_time_to_visit,
                    durationSuggestion: rec.duration_suggestion,
                    viewsCount: rec.views_count,
                    likesCount: rec.likes_count,
                    savesCount: rec.saves_count,
                    ratingsCount: rec.ratings_count,
                    avgRating: rec.avg_rating ? parseFloat(rec.avg_rating) : 0,
                    createdAt: rec.created_at,
                    category: {
                        id: rec.category_id,
                        name: rec.category_name
                    },
                    creator: {
                        username: rec.creator_username,
                        fullName: rec.creator_name,
                        profilePhoto: rec.creator_photo
                    },
                    photos: rec.photos || [],
                    tags: rec.tags || []
                })),
                categories: categoriesResult.rows.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    iconUrl: cat.icon_url,
                    count: cat.count
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching city details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch city details'
        });
    }
};

// Get all cities with recommendation counts
export const getAllCities = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT 
        c.id,
        c.name,
        c.country,
        c.state_province,
        c.description,
        c.cover_image_url,
        c.latitude,
        c.longitude,
        (
            SELECT COUNT(DISTINCT r.id)::int
            FROM recommendations r
            INNER JOIN recommendation_cities rci ON r.id = rci.recommendation_id
            WHERE rci.city_id = c.id AND r.status = 'active'
        ) as recommendations_count
        FROM cities c
        ORDER BY recommendations_count DESC, c.name ASC`
        );

        res.json({
            success: true,
            data: result.rows.map(city => ({
                id: city.id,
                name: city.name,
                country: city.country,
                stateProvince: city.state_province,
                description: city.description,
                coverImage: city.cover_image_url,
                latitude: city.latitude ? parseFloat(city.latitude) : null,
                longitude: city.longitude ? parseFloat(city.longitude) : null,
                recommendationsCount: city.recommendations_count
            }))
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cities'
        });
    }
};
