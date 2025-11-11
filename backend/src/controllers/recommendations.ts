import { Request, Response } from 'express';
import { query } from '../lib/database';
import { processImage, generateFilename, deleteRecommendationFolder } from '../utils/imageUpload';
import { notifyRecommendationLike, notifyRecommendationRating } from '../utils/notifications';

// Get all recommendations with pagination and filters
export const getRecommendations = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            category_id,
            city_id,
            user_id,
            search
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        
        let whereConditions = ['r.status = $1'];
        let queryParams: any[] = ['active'];
        let paramIndex = 2;

        // Add filters
        if (category_id) {
            whereConditions.push(`r.category_id = $${paramIndex}`);
            queryParams.push(category_id);
            paramIndex++;
        }

        if (city_id) {
            whereConditions.push(`rc.city_id = $${paramIndex}`);
            queryParams.push(city_id);
            paramIndex++;
        }

        if (user_id) {
            whereConditions.push(`r.user_id = $${paramIndex}`);
            queryParams.push(user_id);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Get recommendations with user and category info
        const recommendationsQuery = `
            SELECT 
                r.id,
                r.title,
                r.description,
                r.price_range_min,
                r.price_range_max,
                r.difficulty_level,
                r.address,
                r.latitude,
                r.longitude,
                r.best_time_to_visit,
                r.duration_suggestion,
                r.user_rating,
                r.views_count,
                r.likes_count,
                r.created_at,
                r.updated_at,
                u.username,
                u.full_name,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                COALESCE(
                    (SELECT array_agg(rp.photo_url ORDER BY rp.is_primary DESC, rp.created_at ASC) 
                        FROM recommendation_photos rp 
                        WHERE rp.recommendation_id = r.id), 
                    ARRAY[]::varchar[]
                ) as photos
            FROM recommendations r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_cities ON r.id = rec_cities.recommendation_id
            LEFT JOIN cities c ON rec_cities.city_id = c.id
            WHERE ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(Number(limit), offset);

        const recommendations = await query(recommendationsQuery, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM recommendations r
            LEFT JOIN recommendation_cities rec_cities ON r.id = rec_cities.recommendation_id
            WHERE ${whereClause}
        `;

        const countResult = await query(countQuery, queryParams.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                recommendations: recommendations.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error('Get recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendations',
            error: error.message
        });
    }
};

// Get single recommendation by ID
export const getRecommendationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const recommendationQuery = `
            SELECT 
                r.*,
                u.username,
                u.full_name,
                up.profile_photo_url as profile_picture_url,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                (SELECT array_agg(photo_url ORDER BY is_primary DESC, created_at ASC) 
                    FROM recommendation_photos 
                    WHERE recommendation_id = r.id) as photos,
                (SELECT array_agg(rt.name) 
                    FROM recommendation_tag_links rtl
                    JOIN recommendation_tags rt ON rtl.tag_id = rt.id
                    WHERE rtl.recommendation_id = r.id) as tags,
                (SELECT AVG(rating)::NUMERIC(3,2) FROM recommendation_ratings WHERE recommendation_id = r.id) as average_rating,
                (SELECT COUNT(*) FROM recommendation_ratings WHERE recommendation_id = r.id) as rating_count
            FROM recommendations r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_cities ON r.id = rec_cities.recommendation_id
            LEFT JOIN cities c ON rec_cities.city_id = c.id
            WHERE r.id = $1 AND r.status = 'active'
        `;

        const result = await query(recommendationQuery, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        const recommendation = result.rows[0];

        // Get user's rating if authenticated
        if (userId) {
            const userRatingResult = await query(
                'SELECT rating, review FROM recommendation_ratings WHERE recommendation_id = $1 AND user_id = $2',
                [id, userId]
            );
            
            if (userRatingResult.rows.length > 0) {
                recommendation.user_rating_value = userRatingResult.rows[0].rating;
                recommendation.user_review = userRatingResult.rows[0].review;
            }

            // Check if user has liked this recommendation
            const userLikeResult = await query(
                'SELECT id FROM recommendation_likes WHERE recommendation_id = $1 AND user_id = $2',
                [id, userId]
            );
            
            recommendation.user_has_liked = userLikeResult.rows.length > 0;
        }

        // Increment view count
        await query(
            'UPDATE recommendations SET views_count = views_count + 1 WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            data: recommendation
        });
    } catch (error: any) {
        console.error('Get recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recommendation',
            error: error.message
        });
    }
};

// Create new recommendation
export const createRecommendation = async (req: Request, res: Response) => {
    console.log('[CREATE_REC] Request received:', req.method, req.url);
    console.log('[CREATE_REC] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[CREATE_REC] Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const {
            place_name,
            description,
            category_id,
            custom_category,
            city_name,
            custom_city,
            address,
            price_range_min,
            price_range_max,
            difficulty_level,
            latitude,
            longitude,
            best_time_to_visit,
            duration_suggestion,
            user_rating
        } = req.body;

        const userId = (req as any).user?.userId;
        
        console.log('[CREATE_REC] User from middleware:', (req as any).user);
        console.log('[CREATE_REC] User ID:', userId);

        if (!userId) {
            console.log('[CREATE_REC] Authentication failed - no user ID');
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        console.log('[CREATE_REC] Starting recommendation creation...');

        try {
            // Handle custom category
            let finalCategoryId = category_id;
            if (custom_category && !category_id) {
                console.log('[CREATE_REC] Creating custom category:', custom_category);
                // Check if custom category already exists
                const existingCategory = await query(
                    'SELECT id FROM recommendation_categories WHERE name = $1',
                    [custom_category]
                );
                
                if (existingCategory.rows.length > 0) {
                    finalCategoryId = existingCategory.rows[0].id;
                    console.log('[CREATE_REC] Using existing category:', finalCategoryId);
                } else {
                    // Create new custom category
                    const newCategoryResult = await query(
                        'INSERT INTO recommendation_categories (name, description) VALUES ($1, $2) RETURNING id',
                        [custom_category, `Custom category: ${custom_category}`]
                    );
                    finalCategoryId = newCategoryResult.rows[0].id;
                    console.log('[CREATE_REC] Created new category:', finalCategoryId);
                }
            }

            // Handle city - either from city_name or custom_city
            let finalCityId = null;
            
            if (city_name) {
                console.log('[CREATE_REC] Processing selected city:', city_name);
                // User selected an existing city from their visited cities
                const existingCity = await query(
                    'SELECT id FROM cities WHERE name = $1',
                    [city_name]
                );
                
                if (existingCity.rows.length > 0) {
                    finalCityId = existingCity.rows[0].id;
                    console.log('[CREATE_REC] Using existing city:', finalCityId);
                } else {
                    // Create new city
                    const newCityResult = await query(
                        'INSERT INTO cities (name, country, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id',
                        [city_name, '', latitude || 0, longitude || 0]
                    );
                    finalCityId = newCityResult.rows[0].id;
                    console.log('[CREATE_REC] Created new city:', finalCityId);
                }
            } else if (custom_city) {
                console.log('[CREATE_REC] Processing custom city:', custom_city);
                // User entered a custom city
                // Parse custom city (format: "City, Country" or just "City")
                const cityParts = custom_city.split(',').map((s: string) => s.trim());
                const cityName = cityParts[0];
                const country = cityParts[1] || '';
                
                // Check if custom city already exists
                const existingCity = await query(
                    'SELECT id FROM cities WHERE name = $1 AND country = $2',
                    [cityName, country]
                );
                
                if (existingCity.rows.length > 0) {
                    finalCityId = existingCity.rows[0].id;
                    console.log('[CREATE_REC] Using existing custom city:', finalCityId);
                } else {
                    // Create new custom city
                    const newCityResult = await query(
                        'INSERT INTO cities (name, country, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id',
                        [cityName, country, latitude || 0, longitude || 0]
                    );
                    finalCityId = newCityResult.rows[0].id;
                    console.log('[CREATE_REC] Created new custom city:', finalCityId);
                }
            }

            console.log('[CREATE_REC] Final values - Category ID:', finalCategoryId, 'City ID:', finalCityId);

            // Insert recommendation with only database schema fields
            const recommendationQuery = `
                INSERT INTO recommendations (
                    user_id, title, description, category_id, 
                    price_range_min, price_range_max, difficulty_level,
                    address, latitude, longitude,
                    best_time_to_visit, duration_suggestion, user_rating
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id
            `;

            console.log('[CREATE_REC] Inserting recommendation with values:', [
                userId, place_name, description, finalCategoryId,
                price_range_min, price_range_max, difficulty_level,
                address, latitude, longitude,
                best_time_to_visit, duration_suggestion, user_rating
            ]);

            const recommendationResult = await query(recommendationQuery, [
                userId, place_name, description, finalCategoryId,
                price_range_min, price_range_max, difficulty_level,
                address, latitude, longitude,
                best_time_to_visit, duration_suggestion, user_rating
            ]);

            const recommendationId = recommendationResult.rows[0].id;
            console.log('[CREATE_REC] Created recommendation with ID:', recommendationId);

            // Link to city if we have one
            if (finalCityId) {
                console.log('[CREATE_REC] Linking recommendation to city...');
                await query(
                    'INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES ($1, $2)',
                    [recommendationId, finalCityId]
                );
                console.log('[CREATE_REC] Successfully linked to city');
            }

            console.log('[CREATE_REC] Recommendation created successfully');
            res.status(201).json({
                success: true,
                message: 'Recommendation created successfully',
                data: { id: recommendationId }
            });
        } catch (error: any) {
            console.error('[CREATE_REC] Database error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create recommendation',
                error: error.message
            });
        }
    } catch (error: any) {
        console.error('[CREATE_REC] Outer error:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred',
            error: error.message
        });
    }
};

// Update recommendation
export const updateRecommendation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            place_name,
            description,
            category_id,
            city_id,
            location,
            address,
            pros_points,
            progress_percentage,
            latitude,
            longitude,
            best_time_to_visit,
            duration_suggestion,
            user_rating,
            additional_notes,
            tags
        } = req.body;

        const userId = (req as any).user?.userId;

        // Check if recommendation exists and user owns it
        const existingRecommendation = await query(
            'SELECT user_id FROM recommendations WHERE id = $1',
            [id]
        );

        if (existingRecommendation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        if (existingRecommendation.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this recommendation'
            });
        }

        // Start transaction
        await query('BEGIN');

        try {
            // Update recommendation
            const updateQuery = `
                UPDATE recommendations SET
                    title = $1, description = $2, category_id = $3,
                    address = $4, latitude = $5, longitude = $6, 
                    best_time_to_visit = $7, duration_suggestion = $8, 
                    user_rating = $9, updated_at = NOW()
                WHERE id = $10
            `;

            await query(updateQuery, [
                place_name, description, category_id, address, 
                latitude, longitude, best_time_to_visit, 
                duration_suggestion, user_rating, id
            ]);

            // Update city link
            await query(
                'DELETE FROM recommendation_cities WHERE recommendation_id = $1',
                [id]
            );

            if (city_id) {
                await query(
                    'INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES ($1, $2)',
                    [id, city_id]
                );
            }

            // Update tags
            await query(
                'DELETE FROM recommendation_tag_links WHERE recommendation_id = $1',
                [id]
            );

            if (tags && Array.isArray(tags)) {
                for (const tagName of tags) {
                    let tagResult = await query(
                        'SELECT id FROM recommendation_tags WHERE name = $1',
                        [tagName]
                    );

                    let tagId: any;
                    if (tagResult.rows.length === 0) {
                        const newTagResult = await query(
                            'INSERT INTO recommendation_tags (name) VALUES ($1) RETURNING id',
                            [tagName]
                        );
                        tagId = newTagResult.rows[0].id;
                    } else {
                        tagId = tagResult.rows[0].id;
                    }

                    await query(
                        'INSERT INTO recommendation_tag_links (recommendation_id, tag_id) VALUES ($1, $2)',
                        [id, tagId]
                    );
                }
            }

            await query('COMMIT');

            res.json({
                success: true,
                message: 'Recommendation updated successfully'
            });
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error: any) {
        console.error('Update recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update recommendation',
            error: error.message
        });
    }
};

// Delete recommendation
export const deleteRecommendation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        // Check if recommendation exists and user owns it
        const existingRecommendation = await query(
            'SELECT user_id FROM recommendations WHERE id = $1',
            [id]
        );

        if (existingRecommendation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        if (existingRecommendation.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this recommendation'
            });
        }

        // Delete physical files from disk
        try {
            await deleteRecommendationFolder(userId, parseInt(id, 10));
        } catch (fileError) {
            console.error('Error deleting recommendation files:', fileError);
            // Continue with database deletion even if file deletion fails
        }

        // Delete from database (cascade will delete photos, ratings, etc.)
        await query(
            'DELETE FROM recommendations WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Recommendation deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete recommendation',
            error: error.message
        });
    }
};

// Upload photos for recommendation
export const uploadRecommendationPhotos = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        // Check if recommendation exists and user owns it
        const existingRecommendation = await query(
            'SELECT user_id FROM recommendations WHERE id = $1',
            [id]
        );

        if (existingRecommendation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        if (existingRecommendation.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to upload photos for this recommendation'
            });
        }

        if (!req.files || (req.files as any).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No photos uploaded'
            });
        }

        const files = req.files as Express.Multer.File[];
        const uploadedPhotos = [];
        const recommendationId = parseInt(id, 10);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filename = generateFilename(file.originalname, 'recommendation');
            const photoUrl = await processImage(file.buffer, userId, 'recommendation', filename, recommendationId);
            const isPrimary = i === 0; // First photo is primary

            const result = await query(
                'INSERT INTO recommendation_photos (recommendation_id, photo_url, is_primary) VALUES ($1, $2, $3) RETURNING id',
                [id, photoUrl, isPrimary]
            );

            uploadedPhotos.push({
                id: result.rows[0].id,
                photo_url: photoUrl,
                is_primary: isPrimary
            });
        }

        res.json({
            success: true,
            message: 'Photos uploaded successfully',
            data: { photos: uploadedPhotos }
        });
    } catch (error: any) {
        console.error('Upload photos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload photos',
            error: error.message
        });
    }
};

// Delete recommendation photo
export const deleteRecommendationPhoto = async (req: Request, res: Response) => {
    try {
        const { id, photoId } = req.params;
        const userId = (req as any).user?.userId;

        // Check if recommendation exists and user owns it
        const existingRecommendation = await query(
            'SELECT user_id FROM recommendations WHERE id = $1',
            [id]
        );

        if (existingRecommendation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        if (existingRecommendation.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete photos for this recommendation'
            });
        }

        // Get photo info before deleting
        const photoResult = await query(
            'SELECT photo_url, is_primary FROM recommendation_photos WHERE id = $1 AND recommendation_id = $2',
            [photoId, id]
        );

        if (photoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
        }

        // Delete from database
        await query(
            'DELETE FROM recommendation_photos WHERE id = $1',
            [photoId]
        );

        // If this was the primary photo, set another photo as primary
        if (photoResult.rows[0].is_primary) {
            await query(
                'UPDATE recommendation_photos SET is_primary = true WHERE recommendation_id = $1 AND id = (SELECT id FROM recommendation_photos WHERE recommendation_id = $1 ORDER BY created_at ASC LIMIT 1)',
                [id]
            );
        }

        res.json({
            success: true,
            message: 'Photo deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete photo',
            error: error.message
        });
    }
};

// Set primary photo for recommendation
export const setPrimaryRecommendationPhoto = async (req: Request, res: Response) => {
    try {
        const { id, photoId } = req.params;
        const userId = (req as any).user?.userId;

        // Check if recommendation exists and user owns it
        const existingRecommendation = await query(
            'SELECT user_id FROM recommendations WHERE id = $1',
            [id]
        );

        if (existingRecommendation.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        if (existingRecommendation.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify photos for this recommendation'
            });
        }

        // Verify photo belongs to this recommendation
        const photoResult = await query(
            'SELECT id FROM recommendation_photos WHERE id = $1 AND recommendation_id = $2',
            [photoId, id]
        );

        if (photoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
        }

        // Unset all primary flags for this recommendation
        await query(
            'UPDATE recommendation_photos SET is_primary = false WHERE recommendation_id = $1',
            [id]
        );

        // Set this photo as primary
        await query(
            'UPDATE recommendation_photos SET is_primary = true WHERE id = $1',
            [photoId]
        );

        res.json({
            success: true,
            message: 'Primary photo updated successfully'
        });
    } catch (error: any) {
        console.error('Set primary photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set primary photo',
            error: error.message
        });
    }
};

// Get recommendation categories
export const getRecommendationCategories = async (req: Request, res: Response) => {
    try {
        const categories = await query(
            'SELECT id, name, description, icon_url FROM recommendation_categories ORDER BY name'
        );

        res.json({
            success: true,
            data: categories.rows
        });
    } catch (error: any) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};

// Get cities - returns cities the user has visited from their profile
export const getCities = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        const userId = (req as any).user?.userId; // Get user ID from auth middleware if available
        
        console.log('[CITIES] Request headers:', JSON.stringify(req.headers, null, 2));
        console.log('[CITIES] User from middleware:', (req as any).user);
        console.log('[CITIES] User ID:', userId);
        
        let cities: any[] = [];

        if (userId) {
            console.log('[CITIES] User authenticated, fetching cities for user:', userId);
            // If user is authenticated, get cities from their profile
            const profileResult = await query(
                'SELECT cities_visited FROM user_profiles WHERE user_id = $1',
                [userId]
            );

            console.log('[CITIES] Profile query result:', profileResult.rows);

            if (profileResult.rows.length > 0 && profileResult.rows[0].cities_visited) {
                const citiesVisited = profileResult.rows[0].cities_visited;
                console.log('[CITIES] Cities visited from profile:', citiesVisited);
                
                // Convert the JSON array to the expected format
                cities = citiesVisited.map((cityName: string, index: number) => ({
                    id: index + 1, // Use sequential numeric ID
                    name: cityName,
                    country: '', // You can enhance this later to include country/state
                    state_province: ''
                }));

                console.log('[CITIES] Formatted cities:', cities);

                // Filter by search if provided
                if (search) {
                    const searchLower = search.toString().toLowerCase();
                    cities = cities.filter(city => 
                        city.name.toLowerCase().includes(searchLower)
                    );
                }
            } else {
                console.log('[CITIES] No profile found or no cities_visited data for user:', userId);
            }
        } else {
            console.log('[CITIES] No user authenticated, returning empty cities');
        }

        console.log('[CITIES] Final cities response:', cities);
        res.json({
            success: true,
            data: cities
        });
    } catch (error: any) {
        console.error('Get cities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cities',
            error: error.message
        });
    }
};

// Submit or update rating for a recommendation
export const submitRating = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;
        const userId = (req as any).user?.userId;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Check if recommendation exists
        const recommendationResult = await query(
            'SELECT user_id, status FROM recommendations WHERE id = $1',
            [id]
        );

        if (recommendationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        // Check if user is trying to rate their own recommendation
        if (recommendationResult.rows[0].user_id === userId) {
            return res.status(403).json({
                success: false,
                message: 'You cannot rate your own recommendation'
            });
        }

        // Check if recommendation is active
        if (recommendationResult.rows[0].status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This recommendation is not available for rating'
            });
        }

        // Check if this is a new rating (not an update)
        const existingRatingResult = await query(
            'SELECT id FROM recommendation_ratings WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        const isNewRating = existingRatingResult.rows.length === 0;

        // Insert or update rating
        const result = await query(
            `INSERT INTO recommendation_ratings (recommendation_id, user_id, rating, review, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (recommendation_id, user_id)
             DO UPDATE SET rating = $3, review = $4, updated_at = NOW()
             RETURNING id, rating, review, created_at, updated_at`,
            [id, userId, rating, review || null]
        );

        // Get updated average rating
        const avgResult = await query(
            'SELECT AVG(rating)::NUMERIC(3,2) as avg_rating, COUNT(*) as rating_count FROM recommendation_ratings WHERE recommendation_id = $1',
            [id]
        );

        // Create notification for new ratings (not updates)
        if (isNewRating) {
            // Get rater's details
            const raterResult = await query(
                'SELECT full_name, username FROM users WHERE id = $1',
                [userId]
            );

            const rater = raterResult.rows[0];

            // Get recommendation details
            const recResult = await query(
                'SELECT title FROM recommendations WHERE id = $1',
                [id]
            );

            const recommendationTitle = recResult.rows[0]?.title;

            await notifyRecommendationRating(
                userId,
                recommendationResult.rows[0].user_id,
                rater.full_name,
                rater.username,
                parseInt(id),
                recommendationTitle,
                rating
            );
        }

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            data: {
                rating: result.rows[0],
                averageRating: parseFloat(avgResult.rows[0].avg_rating) || 0,
                ratingCount: parseInt(avgResult.rows[0].rating_count) || 0
            }
        });
    } catch (error: any) {
        console.error('Submit rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit rating',
            error: error.message
        });
    }
};

// Get user's rating for a recommendation
export const getUserRating = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const result = await query(
            'SELECT id, rating, review, created_at, updated_at FROM recommendation_ratings WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: null
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error: any) {
        console.error('Get user rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rating',
            error: error.message
        });
    }
};

// Delete user's rating
export const deleteRating = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const result = await query(
            'DELETE FROM recommendation_ratings WHERE recommendation_id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rating not found'
            });
        }

        res.json({
            success: true,
            message: 'Rating deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete rating',
            error: error.message
        });
    }
};

// Like a recommendation
export const likeRecommendation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        // Check if already liked
        const existingLike = await query(
            'SELECT id FROM recommendation_likes WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingLike.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Already liked this recommendation'
            });
        }

        // Get recommendation details and author info
        const recommendationResult = await query(
            'SELECT r.id, r.title, r.user_id, u.username FROM recommendations r JOIN users u ON r.user_id = u.id WHERE r.id = $1',
            [id]
        );

        if (recommendationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        const recommendation = recommendationResult.rows[0];

        // Get liker's details
        const likerResult = await query(
            'SELECT full_name, username FROM users WHERE id = $1',
            [userId]
        );

        const liker = likerResult.rows[0];

        // Add like
        await query(
            'INSERT INTO recommendation_likes (recommendation_id, user_id) VALUES ($1, $2)',
            [id, userId]
        );

        // Update likes count
        await query(
            'UPDATE recommendations SET likes_count = likes_count + 1 WHERE id = $1',
            [id]
        );

        // Create notification for the recommendation author (if not liking own recommendation)
        if (recommendation.user_id !== userId) {
            await notifyRecommendationLike(
                userId,
                recommendation.user_id,
                liker.full_name,
                liker.username,
                parseInt(id),
                recommendation.title
            );
        }

        // Get updated count
        const countResult = await query(
            'SELECT likes_count FROM recommendations WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Recommendation liked successfully',
            data: {
                likes_count: countResult.rows[0]?.likes_count || 0
            }
        });
    } catch (error: any) {
        console.error('Like recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to like recommendation',
            error: error.message
        });
    }
};

// Unlike a recommendation
export const unlikeRecommendation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        // Check if liked
        const existingLike = await query(
            'SELECT id FROM recommendation_likes WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingLike.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Recommendation not liked yet'
            });
        }

        // Remove like
        await query(
            'DELETE FROM recommendation_likes WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        // Update likes count
        await query(
            'UPDATE recommendations SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
            [id]
        );

        // Get updated count
        const countResult = await query(
            'SELECT likes_count FROM recommendations WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Recommendation unliked successfully',
            data: {
                likes_count: countResult.rows[0]?.likes_count || 0
            }
        });
    } catch (error: any) {
        console.error('Unlike recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlike recommendation',
            error: error.message
        });
    }
};

// Check if user liked a recommendation
export const checkLikeStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const result = await query(
            'SELECT id FROM recommendation_likes WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({
            success: true,
            data: {
                isLiked: result.rows.length > 0
            }
        });
    } catch (error: any) {
        console.error('Check like status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check like status',
            error: error.message
        });
    }
};

// Get user's liked recommendations
export const getLikedRecommendations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { page = 1, limit = 12 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const result = await query(`
            SELECT 
                r.id,
                r.title,
                r.description,
                r.price_range_min,
                r.price_range_max,
                r.difficulty_level,
                r.views_count,
                r.likes_count,
                r.created_at,
                u.username,
                u.full_name,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                (SELECT array_agg(photo_url ORDER BY is_primary DESC, created_at ASC) 
                 FROM recommendation_photos 
                 WHERE recommendation_id = r.id) as photos,
                rl.created_at as liked_at
            FROM recommendation_likes rl
            JOIN recommendations r ON rl.recommendation_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_cities ON r.id = rec_cities.recommendation_id
            LEFT JOIN cities c ON rec_cities.city_id = c.id
            WHERE rl.user_id = $1 AND r.status = 'active'
            ORDER BY rl.created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, Number(limit), offset]);

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) as total FROM recommendation_likes WHERE user_id = $1',
            [userId]
        );
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                recommendations: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error('Get liked recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch liked recommendations',
            error: error.message
        });
    }
};

// Save a recommendation
export const saveRecommendation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        // Check if already saved
        const existingSave = await query(
            'SELECT id FROM recommendation_saves WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingSave.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Already saved this recommendation'
            });
        }

        // Check if recommendation exists
        const recommendationResult = await query(
            'SELECT id FROM recommendations WHERE id = $1 AND status = \'active\'',
            [id]
        );

        if (recommendationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        // Add save
        await query(
            'INSERT INTO recommendation_saves (recommendation_id, user_id) VALUES ($1, $2)',
            [id, userId]
        );

        // Update saves count
        await query(
            'UPDATE recommendations SET saves_count = saves_count + 1 WHERE id = $1',
            [id]
        );

        // Get updated count
        const countResult = await query(
            'SELECT saves_count FROM recommendations WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Recommendation saved successfully',
            data: {
                saves_count: countResult.rows[0]?.saves_count || 0
            }
        });
    } catch (error: any) {
        console.error('Save recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save recommendation',
            error: error.message
        });
    }
};

// Unsave a recommendation
export const unsaveRecommendation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        // Check if saved
        const existingSave = await query(
            'SELECT id FROM recommendation_saves WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingSave.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Recommendation not saved yet'
            });
        }

        // Remove save
        await query(
            'DELETE FROM recommendation_saves WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        // Update saves count
        await query(
            'UPDATE recommendations SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = $1',
            [id]
        );

        // Get updated count
        const countResult = await query(
            'SELECT saves_count FROM recommendations WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'Recommendation unsaved successfully',
            data: {
                saves_count: countResult.rows[0]?.saves_count || 0
            }
        });
    } catch (error: any) {
        console.error('Unsave recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unsave recommendation',
            error: error.message
        });
    }
};

// Check if user saved a recommendation
export const checkSaveStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId;

        const result = await query(
            'SELECT id FROM recommendation_saves WHERE recommendation_id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({
            success: true,
            data: {
                isSaved: result.rows.length > 0
            }
        });
    } catch (error: any) {
        console.error('Check save status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check save status',
            error: error.message
        });
    }
};

// Track view for a recommendation
export const trackView = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.userId || null;

        // Check if recommendation exists
        const recommendationResult = await query(
            'SELECT id FROM recommendations WHERE id = $1 AND status = \'active\'',
            [id]
        );

        if (recommendationResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found'
            });
        }

        // Add view record
        await query(
            'INSERT INTO recommendation_views (recommendation_id, user_id) VALUES ($1, $2)',
            [id, userId]
        );

        // Update views count
        await query(
            'UPDATE recommendations SET views_count = views_count + 1 WHERE id = $1',
            [id]
        );

        // Get updated count
        const countResult = await query(
            'SELECT views_count FROM recommendations WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            message: 'View tracked successfully',
            data: {
                views_count: countResult.rows[0]?.views_count || 0
            }
        });
    } catch (error: any) {
        console.error('Track view error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track view',
            error: error.message
        });
    }
};

// Get user's saved recommendations
export const getSavedRecommendations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { page = 1, limit = 12 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const result = await query(`
            SELECT 
                r.id,
                r.title,
                r.description,
                r.price_range_min,
                r.price_range_max,
                r.difficulty_level,
                r.views_count,
                r.likes_count,
                r.saves_count,
                r.created_at,
                u.username,
                u.full_name,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                (SELECT array_agg(photo_url ORDER BY is_primary DESC, created_at ASC) 
                    FROM recommendation_photos 
                    WHERE recommendation_id = r.id) as photos,
                rs.created_at as saved_at
            FROM recommendation_saves rs
            JOIN recommendations r ON rs.recommendation_id = r.id
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
            LEFT JOIN recommendation_cities rec_cities ON r.id = rec_cities.recommendation_id
            LEFT JOIN cities c ON rec_cities.city_id = c.id
            WHERE rs.user_id = $1 AND r.status = 'active'
            ORDER BY rs.created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, Number(limit), offset]);

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) as total FROM recommendation_saves WHERE user_id = $1',
            [userId]
        );
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                recommendations: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error('Get saved recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch saved recommendations',
            error: error.message
        });
    }
};


