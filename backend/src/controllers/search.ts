import { Request, Response } from 'express';
import { query } from '../lib/database';

// Use the standard Request type which already has the user property from auth middleware

export const searchAll = async (req: Request, res: Response) => {
    try {
        const { q: searchQuery, type, limit = 20, offset = 0 } = req.query;

        if (!searchQuery || typeof searchQuery !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = `%${searchQuery.toLowerCase()}%`;
        const limitNum = Math.min(parseInt(limit as string) || 20, 50);
        const offsetNum = parseInt(offset as string) || 0;

        console.log(`[SEARCH] Searching for: "${searchQuery}", type: ${type}, limit: ${limitNum}, offset: ${offsetNum}`);

        let results: any = {
            recommendations: [],
            users: [],
            cities: [],
            total: 0
        };

        // Search recommendations/places
        if (!type || type === 'recommendations' || type === 'places') {
            const recommendationsResult = await query(`
                SELECT DISTINCT
                    r.id,
                    r.title,
                    r.description,
                    r.address,
                    c.name as city_name,
                    rp.photo_url as image_url,
                    rc.name as category,
                    r.created_at,
                    u.username,
                    u.full_name as author_name,
                    up.profile_photo_url as profile_picture,
                    r.likes_count,
                    (SELECT AVG(rating) FROM recommendation_ratings WHERE recommendation_id = r.id) as avg_rating
                FROM recommendations r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
                LEFT JOIN recommendation_cities rcities ON r.id = rcities.recommendation_id
                LEFT JOIN cities c ON rcities.city_id = c.id
                LEFT JOIN recommendation_photos rp ON r.id = rp.recommendation_id AND rp.is_primary = true
                WHERE r.status = 'published' 
                    AND (
                        LOWER(r.title) LIKE $1 
                        OR LOWER(r.description) LIKE $1 
                        OR LOWER(r.address) LIKE $1 
                        OR LOWER(c.name) LIKE $1
                        OR LOWER(rc.name) LIKE $1
                    )
                ORDER BY r.created_at DESC
                LIMIT $2 OFFSET $3
            `, [searchTerm, limitNum, offsetNum]);

            results.recommendations = recommendationsResult.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                location: row.address,
                city: row.city_name,
                imageUrl: row.image_url,
                category: row.category,
                createdAt: row.created_at,
                author: {
                    username: row.username,
                    fullName: row.author_name,
                    profilePicture: row.profile_picture
                },
                likesCount: parseInt(row.likes_count) || 0,
                rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : null,
                type: 'recommendation'
            }));
        }

        // Search users/buddies
        if (!type || type === 'users' || type === 'buddies') {
            const usersResult = await query(`
                SELECT 
                    u.id,
                    u.username,
                    u.full_name,
                    u.bio,
                    up.profile_photo_url as profile_picture,
                    u.current_location as user_location,
                    u.created_at,
                    COUNT(DISTINCT r.id) as recommendations_count
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN recommendations r ON u.id = r.user_id AND r.status = 'published'
                WHERE u.account_status = 'active'
                    AND (
                        LOWER(u.username) LIKE $1 
                        OR LOWER(u.full_name) LIKE $1 
                        OR LOWER(u.bio) LIKE $1
                        OR LOWER(u.current_location) LIKE $1
                    )
                GROUP BY u.id, u.username, u.full_name, u.bio, up.profile_photo_url, u.current_location, u.created_at
                ORDER BY u.created_at DESC
                LIMIT $2 OFFSET $3
            `, [searchTerm, limitNum, offsetNum]);

            results.users = usersResult.rows.map(row => ({
                id: row.id,
                username: row.username,
                fullName: row.full_name,
                bio: row.bio,
                profilePicture: row.profile_picture,
                location: row.user_location,
                connectionsCount: 0, // Removed travel_buddies dependency
                recommendationsCount: parseInt(row.recommendations_count) || 0,
                type: 'user'
            }));
        }

        // Search cities
        if (!type || type === 'cities') {
            const citiesResult = await query(`
                SELECT DISTINCT
                    c.id,
                    c.name as city,
                    c.country,
                    COUNT(DISTINCT rc.recommendation_id) as mentions_count,
                    'city' as type
                FROM cities c
                LEFT JOIN recommendation_cities rc ON c.id = rc.city_id
                LEFT JOIN recommendations r ON rc.recommendation_id = r.id AND r.status = 'published'
                WHERE LOWER(c.name) LIKE $1 OR LOWER(c.country) LIKE $1
                GROUP BY c.id, c.name, c.country
                ORDER BY mentions_count DESC, c.name ASC
                LIMIT $2 OFFSET $3
            `, [searchTerm, limitNum, offsetNum]);

            results.cities = citiesResult.rows.map(row => ({
                id: row.id,
                name: row.city,
                country: row.country,
                mentionsCount: parseInt(row.mentions_count) || 0,
                type: 'city'
            }));
        }

        // Calculate total results
        results.total = results.recommendations.length + results.users.length + results.cities.length;

        console.log(`[SEARCH] Found ${results.total} results: ${results.recommendations.length} recommendations, ${results.users.length} users, ${results.cities.length} cities`);

        // Track search history asynchronously (fire and forget)
        const userId = req.user?.userId;
        if (userId) {
            query(
                `INSERT INTO search_history (user_id, search_query, filters_applied, results_count)
                    VALUES ($1, $2, $3, $4)`,
                [
                    userId,
                    searchQuery,
                    type ? JSON.stringify({ type }) : null,
                    results.total
                ]
            ).catch(err => {
                console.error('[SEARCH] Failed to save search history:', err);
                // Don't fail the request if history tracking fails
            });
        }

        res.json({
            success: true,
            data: results,
            query: searchQuery,
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                total: results.total
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during search'
        });
    }
};

export const searchRecommendations = async (req: Request, res: Response) => {
    try {
        const { q: searchQuery, category, city, limit = 20, offset = 0 } = req.query;

        if (!searchQuery || typeof searchQuery !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = `%${searchQuery.toLowerCase()}%`;
        const limitNum = Math.min(parseInt(limit as string) || 20, 50);
        const offsetNum = parseInt(offset as string) || 0;

        let whereClause = `
            r.status = 'published' 
            AND (
                LOWER(r.title) LIKE $1 
                OR LOWER(r.description) LIKE $1 
                OR LOWER(r.address) LIKE $1 
                OR LOWER(c.name) LIKE $1
                OR LOWER(rc.name) LIKE $1
            )
        `;
        
        const queryParams: any[] = [searchTerm];
        let paramIndex = 2;

        if (category && typeof category === 'string') {
            whereClause += ` AND LOWER(rc.name) = $${paramIndex}`;
            queryParams.push(category.toLowerCase());
            paramIndex++;
        }

        if (city && typeof city === 'string') {
            whereClause += ` AND LOWER(c.name) = $${paramIndex}`;
            queryParams.push(city.toLowerCase());
            paramIndex++;
        }

        queryParams.push(limitNum, offsetNum);

        const result = await query(`
            SELECT DISTINCT
                r.id,
                r.title,
                r.description,
                r.address,
                c.name as city_name,
                rp.photo_url as image_url,
                rc.name as category,
                r.created_at,
                u.username,
                u.full_name as author_name,
                up.profile_photo_url as profile_picture,
                r.likes_count,
                (SELECT AVG(rating) FROM recommendation_ratings WHERE recommendation_id = r.id) as avg_rating
            FROM recommendations r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rcities ON r.id = rcities.recommendation_id
            LEFT JOIN cities c ON rcities.city_id = c.id
            LEFT JOIN recommendation_photos rp ON r.id = rp.recommendation_id AND rp.is_primary = true
            WHERE ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, queryParams);

        const recommendations = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            location: row.address,
            city: row.city_name,
            imageUrl: row.image_url,
            category: row.category,
            createdAt: row.created_at,
            author: {
                username: row.username,
                fullName: row.author_name,
                profilePicture: row.profile_picture
            },
            likesCount: parseInt(row.likes_count) || 0,
            rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : null
        }));

        res.json({
            success: true,
            data: {
                recommendations
            },
            query: searchQuery,
            filters: { category, city },
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                total: recommendations.length
            }
        });

    } catch (error) {
        console.error('Search recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during recommendations search'
        });
    }
};

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { q: searchQuery, location, limit = 20, offset = 0 } = req.query;

        if (!searchQuery || typeof searchQuery !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = `%${searchQuery.toLowerCase()}%`;
        const limitNum = Math.min(parseInt(limit as string) || 20, 50);
        const offsetNum = parseInt(offset as string) || 0;

        let whereClause = `
            u.account_status = 'active'
            AND (
                LOWER(u.username) LIKE $1 
                OR LOWER(u.full_name) LIKE $1 
                OR LOWER(u.bio) LIKE $1
                OR LOWER(u.current_location) LIKE $1
            )
        `;
        
        const queryParams: any[] = [searchTerm];
        let paramIndex = 2;

        if (location && typeof location === 'string') {
            whereClause += ` AND LOWER(u.current_location) = $${paramIndex}`;
            queryParams.push(location.toLowerCase());
            paramIndex++;
        }

        queryParams.push(limitNum, offsetNum);

        const result = await query(`
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.bio,
                up.profile_photo_url as profile_picture,
                u.current_location as user_location,
                u.created_at,
                COUNT(DISTINCT r.id) as recommendations_count
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendations r ON u.id = r.user_id AND r.status = 'published'
            WHERE ${whereClause}
            GROUP BY u.id, u.username, u.full_name, u.bio, up.profile_photo_url, u.current_location, u.created_at
            ORDER BY u.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, queryParams);

        const users = result.rows.map(row => ({
            id: row.id,
            username: row.username,
            fullName: row.full_name,
            bio: row.bio,
            profilePicture: row.profile_picture,
            location: row.user_location,
            recommendationsCount: parseInt(row.recommendations_count) || 0
        }));

        res.json({
            success: true,
            data: {
                users
            },
            query: searchQuery,
            filters: { location },
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                total: users.length
            }
        });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during users search'
        });
    }
};

export const searchCities = async (req: Request, res: Response) => {
    try {
        const { q: searchQuery, limit = 20, offset = 0 } = req.query;

        if (!searchQuery || typeof searchQuery !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchTerm = `%${searchQuery.toLowerCase()}%`;
        const limitNum = Math.min(parseInt(limit as string) || 20, 50);
        const offsetNum = parseInt(offset as string) || 0;

        const result = await query(`
            SELECT DISTINCT
                c.id,
                c.name as city,
                c.country,
                COUNT(DISTINCT rc.recommendation_id) as mentions_count,
                COUNT(DISTINCT r.user_id) as contributors_count
            FROM cities c
            LEFT JOIN recommendation_cities rc ON c.id = rc.city_id
            LEFT JOIN recommendations r ON rc.recommendation_id = r.id AND r.status = 'published'
            WHERE LOWER(c.name) LIKE $1 OR LOWER(c.country) LIKE $1
            GROUP BY c.id, c.name, c.country
            ORDER BY mentions_count DESC, c.name ASC
            LIMIT $2 OFFSET $3
        `, [searchTerm, limitNum, offsetNum]);

        const cities = result.rows.map(row => ({
            id: row.id,
            name: row.city,
            country: row.country,
            mentionsCount: parseInt(row.mentions_count) || 0,
            contributorsCount: parseInt(row.contributors_count) || 0
        }));

        res.json({
            success: true,
            data: {
                cities
            },
            query: searchQuery,
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                total: cities.length
            }
        });

    } catch (error) {
        console.error('Search cities error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during cities search'
        });
    }
};