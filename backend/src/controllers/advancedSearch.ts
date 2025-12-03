import { Request, Response } from 'express';
import { query } from '../lib/database';

/**
 * Advanced Search Controller
 * Handles complex searches with multiple filters for recommendations, users, and cities
 */

interface SearchFilters {
    q?: string;
    location?: string | string[];
    categories?: string | string[];
    tags?: string | string[];
    priceMin?: number;
    priceMax?: number;
    minRating?: number;
    difficulty?: string;
    dateFrom?: string;
    dateTo?: string;
    dateType?: 'created' | 'best_time' | 'both';
    sortBy?: 'relevant' | 'rating' | 'recent' | 'price_low' | 'price_high';
    type?: 'all' | 'recommendations' | 'users' | 'cities';
    view?: 'grid' | 'list';
    limit?: number;
    offset?: number;
}

export const advancedSearch = async (req: Request, res: Response) => {
    try {
        const filters: SearchFilters = {
            q: req.query.q as string,
            location: req.query.location as string | string[],
            categories: req.query.categories as string | string[],
            tags: req.query.tags as string | string[],
            priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
            priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
            minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
            difficulty: req.query.difficulty as string,
            dateFrom: req.query.dateFrom as string,
            dateTo: req.query.dateTo as string,
            dateType: (req.query.dateType as 'created' | 'best_time' | 'both') || 'both',
            sortBy: (req.query.sortBy as any) || 'relevant',
            type: (req.query.type as any) || 'all',
            view: (req.query.view as 'grid' | 'list') || 'grid',
            limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
            offset: parseInt(req.query.offset as string) || 0
        };

        console.log('[ADVANCED_SEARCH] Filters:', JSON.stringify(filters, null, 2));

        const results: any = {
            recommendations: [],
            users: [],
            cities: [],
            total: 0,
            filters: filters
        };

        // Search recommendations if needed
        if (filters.type === 'all' || filters.type === 'recommendations') {
            results.recommendations = await searchRecommendations(filters);
        }

        // Search users if needed
        if (filters.type === 'all' || filters.type === 'users') {
            results.users = await searchUsers(filters);
        }

        // Search cities if needed
        if (filters.type === 'all' || filters.type === 'cities') {
            results.cities = await searchCities(filters);
        }

        results.total = results.recommendations.length + results.users.length + results.cities.length;

        // Track search history asynchronously (fire and forget)
        const userId = req.user?.userId;
        if (userId && filters.q) {
            query(
                `INSERT INTO search_history (user_id, search_query, filters_applied, results_count)
                    VALUES ($1, $2, $3, $4)`,
                [
                    userId,
                    filters.q,
                    JSON.stringify(filters),
                    results.total
                ]
            ).catch(err => {
                console.error('[ADVANCED_SEARCH] Failed to save search history:', err);
                // Don't fail the request if history tracking fails
            });
        }

        res.json({
            success: true,
            data: results,
            pagination: {
                limit: filters.limit,
                offset: filters.offset,
                hasMore: results.total >= filters.limit!
            }
        });

    } catch (error: any) {
        console.error('[ADVANCED_SEARCH] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform advanced search',
            error: error.message
        });
    }
};

/**
 * Search recommendations with advanced filters
 */
async function searchRecommendations(filters: SearchFilters) {
    // Only show active recommendations (public visibility will be handled separately)
    const whereConditions: string[] = ['r.status = $1'];
    const queryParams: any[] = ['active'];
    let paramIndex = 2;

    // Text search
    if (filters.q) {
        const searchTerm = `%${filters.q.toLowerCase()}%`;
        whereConditions.push(`(
            LOWER(r.title) LIKE $${paramIndex}
            OR LOWER(r.description) LIKE $${paramIndex}
            OR LOWER(r.address) LIKE $${paramIndex}
            OR LOWER(c.name) LIKE $${paramIndex}
            OR LOWER(rc.name) LIKE $${paramIndex}
        )`);
        queryParams.push(searchTerm);
        paramIndex++;
    }

    // Location filter
    if (filters.location && filters.location !== 'any') {
        const locations = Array.isArray(filters.location) ? filters.location : [filters.location];
        whereConditions.push(`c.id = ANY($${paramIndex})`);
        queryParams.push(locations.map(Number));
        paramIndex++;
    }

    // Categories filter
    if (filters.categories) {
        const categories = Array.isArray(filters.categories) ? filters.categories : [filters.categories];
        whereConditions.push(`rc.id = ANY($${paramIndex})`);
        queryParams.push(categories.map(Number));
        paramIndex++;
    }

    // Tags filter
    if (filters.tags) {
        const tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
        whereConditions.push(`EXISTS (
            SELECT 1 FROM recommendation_tag_links rtl
            WHERE rtl.recommendation_id = r.id
            AND rtl.tag_id = ANY($${paramIndex})
        )`);
        queryParams.push(tags.map(Number));
        paramIndex++;
    }

    // Price range filter - check if price range overlaps with requested range
    // A range overlaps if: (rec_min <= filter_max) AND (rec_max >= filter_min)
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        const priceParts: string[] = [];
        
        if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
            // Both min and max specified - check overlap
            queryParams.push(filters.priceMin, filters.priceMax);
            priceParts.push(`(
                (r.price_range_min IS NULL AND r.price_range_max IS NULL) OR
                (r.price_range_min <= $${paramIndex + 1} AND (r.price_range_max >= $${paramIndex} OR r.price_range_max IS NULL))
            )`);
            paramIndex += 2;
        } else if (filters.priceMin !== undefined) {
            // Only min specified - include if max >= min
            queryParams.push(filters.priceMin);
            priceParts.push(`(
                r.price_range_max IS NULL OR r.price_range_max >= $${paramIndex}
            )`);
            paramIndex++;
        } else if (filters.priceMax !== undefined) {
            // Only max specified - include if min <= max
            queryParams.push(filters.priceMax);
            priceParts.push(`(
                r.price_range_min IS NULL OR r.price_range_min <= $${paramIndex}
            )`);
            paramIndex++;
        }
        
        if (priceParts.length > 0) {
            whereConditions.push(priceParts.join(' AND '));
        }
    }

    // Minimum rating filter
    if (filters.minRating !== undefined) {
        // This will be filtered in the HAVING clause
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== 'any') {
        whereConditions.push(`LOWER(r.difficulty_level) = $${paramIndex}`);
        queryParams.push(filters.difficulty.toLowerCase());
        paramIndex++;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
        const dateConditions: string[] = [];
        
        if (filters.dateType === 'created' || filters.dateType === 'both') {
            if (filters.dateFrom) {
                dateConditions.push(`r.created_at >= $${paramIndex}`);
                queryParams.push(filters.dateFrom);
                paramIndex++;
            }
            if (filters.dateTo) {
                dateConditions.push(`r.created_at <= $${paramIndex}`);
                queryParams.push(filters.dateTo);
                paramIndex++;
            }
        }
        
        if (filters.dateType === 'best_time' || filters.dateType === 'both') {
            if (filters.dateFrom) {
                dateConditions.push(`r.best_time_to_visit >= $${paramIndex}`);
                queryParams.push(filters.dateFrom);
                paramIndex++;
            }
            if (filters.dateTo) {
                dateConditions.push(`r.best_time_to_visit <= $${paramIndex}`);
                queryParams.push(filters.dateTo);
                paramIndex++;
            }
        }
        
        if (dateConditions.length > 0) {
            whereConditions.push(`(${dateConditions.join(' OR ')})`);
        }
    }

    // Build ORDER BY clause
    let orderBy = 'r.created_at DESC';
    switch (filters.sortBy) {
        case 'rating':
            orderBy = 'avg_rating DESC NULLS LAST, r.created_at DESC';
            break;
        case 'recent':
            orderBy = 'r.created_at DESC';
            break;
        case 'price_low':
            orderBy = 'r.price_range_min ASC NULLS LAST, r.created_at DESC';
            break;
        case 'price_high':
            orderBy = 'r.price_range_max DESC NULLS LAST, r.created_at DESC';
            break;
        case 'relevant':
        default:
            // For relevant, we'll use a simple text match scoring later
            orderBy = 'r.created_at DESC';
            break;
    }

    const whereClause = whereConditions.join(' AND ');
    const havingClause = filters.minRating !== undefined 
        ? `HAVING AVG(rr.rating) >= ${filters.minRating}` 
        : '';

    queryParams.push(filters.limit!, filters.offset!);

    const sqlQuery = `
        SELECT DISTINCT
            r.id,
            r.title,
            r.description,
            r.address as location,
            r.price_range_min,
            r.price_range_max,
            r.difficulty_level,
            r.best_time_to_visit,
            r.duration_suggestion,
            r.created_at,
            c.id as city_id,
            c.name as city_name,
            c.country,
            rp.photo_url as image_url,
            rc.id as category_id,
            rc.name as category_name,
            u.id as author_id,
            u.username as author_username,
            u.full_name as author_name,
            up.profile_photo_url as author_profile_picture,
            r.likes_count,
            r.views_count,
            COALESCE(AVG(rr.rating), 0) as avg_rating,
            COUNT(DISTINCT rr.id) as rating_count
        FROM recommendations r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
        LEFT JOIN recommendation_cities rcities ON r.id = rcities.recommendation_id
        LEFT JOIN cities c ON rcities.city_id = c.id
        LEFT JOIN recommendation_photos rp ON r.id = rp.recommendation_id AND rp.is_primary = true
        LEFT JOIN recommendation_ratings rr ON r.id = rr.recommendation_id
        WHERE ${whereClause}
        GROUP BY r.id, c.id, c.name, c.country, rp.photo_url, rc.id, rc.name, u.id, u.username, u.full_name, up.profile_photo_url
        ${havingClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    console.log('[SEARCH_RECOMMENDATIONS] Query:', sqlQuery);
    console.log('[SEARCH_RECOMMENDATIONS] Params:', queryParams);

    const result = await query(sqlQuery, queryParams);

    return result.rows.map(row => ({
        id: row.id,
        type: 'recommendation',
        title: row.title,
        description: row.description,
        location: row.location,
        city: {
            id: row.city_id,
            name: row.city_name,
            country: row.country
        },
        price: {
            min: row.price_range_min,
            max: row.price_range_max,
            display: formatPriceRange(row.price_range_min, row.price_range_max)
        },
        difficulty: row.difficulty_level,
        duration: row.duration_suggestion,
        bestTimeToVisit: row.best_time_to_visit,
        imageUrl: row.image_url,
        category: {
            id: row.category_id,
            name: row.category_name
        },
        author: {
            id: row.author_id,
            username: row.author_username,
            name: row.author_name,
            profilePicture: row.author_profile_picture
        },
        stats: {
            likes: parseInt(row.likes_count) || 0,
            views: parseInt(row.views_count) || 0,
            rating: parseFloat(row.avg_rating) || 0,
            ratingCount: parseInt(row.rating_count) || 0
        },
        createdAt: row.created_at
    }));
}

/**
 * Search users with filters
 */
async function searchUsers(filters: SearchFilters) {
    if (!filters.q) return [];

    const searchTerm = `%${filters.q.toLowerCase()}%`;
    const whereConditions: string[] = ['u.account_status = $1'];
    const queryParams: any[] = ['active', searchTerm];
    let paramIndex = 3;

    // Location filter for users
    if (filters.location && filters.location !== 'any') {
        whereConditions.push(`LOWER(u.current_location) LIKE $${paramIndex}`);
        queryParams.push(`%${filters.location}%`);
        paramIndex++;
    }

    queryParams.push(filters.limit!, filters.offset!);

    const result = await query(`
        SELECT 
            u.id,
            u.username,
            u.full_name,
            u.bio,
            up.profile_photo_url as profile_picture,
            u.current_location,
            u.created_at,
            COUNT(DISTINCT r.id) as recommendations_count
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN recommendations r ON u.id = r.user_id AND r.status = 'published'
        WHERE ${whereConditions.join(' AND ')}
            AND (
                LOWER(u.username) LIKE $2
                OR LOWER(u.full_name) LIKE $2
                OR LOWER(u.bio) LIKE $2
                OR LOWER(u.current_location) LIKE $2
            )
        GROUP BY u.id, u.username, u.full_name, u.bio, up.profile_photo_url, u.current_location, u.created_at
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, queryParams);

    return result.rows.map(row => ({
        id: row.id,
        type: 'user',
        username: row.username,
        fullName: row.full_name,
        bio: row.bio,
        profilePicture: row.profile_picture,
        location: row.current_location,
        recommendationsCount: parseInt(row.recommendations_count) || 0,
        createdAt: row.created_at
    }));
}

/**
 * Search cities with filters
 */
async function searchCities(filters: SearchFilters) {
    if (!filters.q) return [];

    const searchTerm = `%${filters.q.toLowerCase()}%`;
    
    const result = await query(`
        SELECT DISTINCT
            c.id,
            c.name,
            c.country,
            c.state_province,
            c.cover_image_url,
            c.description,
            COUNT(DISTINCT rc.recommendation_id) as recommendations_count,
            COUNT(DISTINCT r.user_id) as contributors_count
        FROM cities c
        LEFT JOIN recommendation_cities rc ON c.id = rc.city_id
        LEFT JOIN recommendations r ON rc.recommendation_id = r.id AND r.status = 'active'
        WHERE LOWER(c.name) LIKE $1 OR LOWER(c.country) LIKE $1
        GROUP BY c.id, c.name, c.country, c.state_province, c.cover_image_url, c.description
        ORDER BY recommendations_count DESC, c.name ASC
        LIMIT $2 OFFSET $3
    `, [searchTerm, filters.limit!, filters.offset!]);

    return result.rows.map(row => ({
        id: row.id,
        type: 'city',
        title: row.name, // Add title property for consistency with ResultCard
        name: row.name,
        description: row.description || `Explore ${row.name}, ${row.country} - ${row.recommendations_count} recommendations from ${row.contributors_count} travelers`,
        city: {
            id: row.id,
            name: row.name,
            country: row.country
        },
        country: row.country,
        stateProvince: row.state_province,
        imageUrl: row.cover_image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(row.name)},city`,
        stats: {
            likes: 0,
            views: 0,
            rating: 0,
            ratingCount: 0
        },
        recommendationsCount: parseInt(row.recommendations_count) || 0,
        contributorsCount: parseInt(row.contributors_count) || 0
    }));
}

/**
 * Get all available filter options
 */
export const getSearchFilters = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id; // Get authenticated user ID

        // Get all categories
        const categoriesResult = await query(`
            SELECT id, name, description, icon_url
            FROM recommendation_categories
            ORDER BY name ASC
        `);

        // Get cities - prioritize user's traveled cities
        const citiesResult = await query(`
            SELECT DISTINCT
                c.id,
                c.name,
                c.country,
                COUNT(DISTINCT rc.recommendation_id) as rec_count,
                ${userId ? `CASE WHEN EXISTS(
                    SELECT 1 FROM recommendation_cities rc2
                    JOIN recommendations r2 ON rc2.recommendation_id = r2.id
                    WHERE rc2.city_id = c.id AND r2.user_id = $1
                ) THEN 1 ELSE 0 END as user_visited` : '0 as user_visited'}
            FROM cities c
            LEFT JOIN recommendation_cities rc ON c.id = rc.city_id
            LEFT JOIN recommendations r ON rc.recommendation_id = r.id AND r.status = 'active'
            GROUP BY c.id, c.name, c.country
            HAVING COUNT(DISTINCT rc.recommendation_id) > 0
            ORDER BY ${userId ? 'user_visited DESC,' : ''} rec_count DESC, c.name ASC
        `, userId ? [userId] : []);

        // Get all tags
        const tagsResult = await query(`
            SELECT DISTINCT rt.id, rt.name
            FROM recommendation_tags rt
            JOIN recommendation_tag_links rtl ON rt.id = rtl.tag_id
            JOIN recommendations r ON rtl.recommendation_id = r.id
            WHERE r.status = 'active'
            ORDER BY rt.name ASC
        `);

        // Get difficulty levels
        const difficultyResult = await query(`
            SELECT DISTINCT difficulty_level
            FROM recommendations
            WHERE difficulty_level IS NOT NULL
            ORDER BY difficulty_level
        `);

        // Get price range
        const priceRangeResult = await query(`
            SELECT 
                MIN(price_range_min) as min_price,
                MAX(price_range_max) as max_price
            FROM recommendations
            WHERE price_range_min IS NOT NULL OR price_range_max IS NOT NULL
        `);

        res.json({
            success: true,
            data: {
                categories: categoriesResult.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    icon: row.icon_url
                })),
                cities: citiesResult.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    country: row.country,
                    recommendationsCount: parseInt(row.rec_count),
                    userVisited: row.user_visited === 1 || row.user_visited === '1'
                })),
                tags: tagsResult.rows.map(row => ({
                    id: row.id,
                    name: row.name
                })),
                difficulties: difficultyResult.rows.map(row => row.difficulty_level),
                priceRange: {
                    min: parseFloat(priceRangeResult.rows[0]?.min_price) || 0,
                    max: parseFloat(priceRangeResult.rows[0]?.max_price) || 500
                },
                sortOptions: [
                    { value: 'relevant', label: 'Most Relevant' },
                    { value: 'rating', label: 'Highest Rating' },
                    { value: 'recent', label: 'Most Recent' },
                    { value: 'price_low', label: 'Price: Low to High' },
                    { value: 'price_high', label: 'Price: High to Low' }
                ]
            }
        });

    } catch (error: any) {
        console.error('[GET_SEARCH_FILTERS] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch search filters',
            error: error.message
        });
    }
};

/**
 * Helper function to format price range
 */
function formatPriceRange(min: number | null, max: number | null): string {
    // Show FREE if both are 0
    if (min === 0 && max === 0) return 'FREE';
    if (!min && !max) return 'Free';
    if (!min) return `Up to $${max}`;
    if (!max) return `From $${min}`;
    if (min === max) return `$${min}`;
    return `$${min}-$${max}`;
}
