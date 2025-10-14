import { Request, Response } from 'express';
import { query } from '../lib/database';
import { processImage, generateFilename } from '../utils/imageUpload';

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
                (SELECT array_agg(rp.photo_url) 
                    FROM recommendation_photos rp 
                    WHERE rp.recommendation_id = r.id 
                    ORDER BY rp.is_primary DESC, rp.created_at ASC) as photos
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

        const recommendationQuery = `
            SELECT 
                r.*,
                u.username,
                u.full_name,
                rc.name as category_name,
                c.name as city_name,
                c.country,
                (SELECT array_agg(rp.photo_url) 
                    FROM recommendation_photos rp 
                    WHERE rp.recommendation_id = r.id 
                    ORDER BY rp.is_primary DESC, rp.created_at ASC) as photos,
                (SELECT array_agg(rt.name) 
                    FROM recommendation_tag_links rtl
                    JOIN recommendation_tags rt ON rtl.tag_id = rt.id
                    WHERE rtl.recommendation_id = r.id) as tags
            FROM recommendations r
            LEFT JOIN users u ON r.user_id = u.id
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

        // Increment view count
        await query(
            'UPDATE recommendations SET views_count = views_count + 1 WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            data: result.rows[0]
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
    try {
        const {
            place_name,
            description,
            category_id,
            custom_category,
            city_id,
            custom_city,
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

        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Start transaction
        const client = await query('BEGIN');

        try {
            // Handle custom category
            let finalCategoryId = category_id;
            if (custom_category && !category_id) {
                // Check if custom category already exists
                const existingCategory = await query(
                    'SELECT id FROM recommendation_categories WHERE name = $1',
                    [custom_category]
                );
                
                if (existingCategory.rows.length > 0) {
                    finalCategoryId = existingCategory.rows[0].id;
                } else {
                    // Create new custom category
                    const newCategoryResult = await query(
                        'INSERT INTO recommendation_categories (name, description) VALUES ($1, $2) RETURNING id',
                        [custom_category, `Custom category: ${custom_category}`]
                    );
                    finalCategoryId = newCategoryResult.rows[0].id;
                }
            }

            // Handle custom city
            let finalCityId = city_id;
            if (custom_city && !city_id) {
                // Parse custom city (format: "City, Country")
                const [cityName, country] = custom_city.split(',').map(s => s.trim());
                
                // Check if custom city already exists
                const existingCity = await query(
                    'SELECT id FROM cities WHERE name = $1 AND country = $2',
                    [cityName, country]
                );
                
                if (existingCity.rows.length > 0) {
                    finalCityId = existingCity.rows[0].id;
                } else {
                    // Create new custom city
                    const newCityResult = await query(
                        'INSERT INTO cities (name, country, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id',
                        [cityName, country, latitude || 0, longitude || 0]
                    );
                    finalCityId = newCityResult.rows[0].id;
                }
            }

            // Insert recommendation
            const recommendationQuery = `
                INSERT INTO recommendations (
                    user_id, title, description, category_id, location,
                    address, pros_points, progress_percentage, latitude, longitude,
                    best_time_to_visit, duration_suggestion, user_rating, additional_notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id
            `;

            const recommendationResult = await query(recommendationQuery, [
                userId, place_name, description, finalCategoryId, location,
                address, pros_points, progress_percentage, latitude, longitude,
                best_time_to_visit, duration_suggestion, user_rating, additional_notes
            ]);

            const recommendationId = recommendationResult.rows[0].id;

            // Link to city
            if (finalCityId) {
                await query(
                    'INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES ($1, $2)',
                    [recommendationId, finalCityId]
                );
            }

            // Handle tags
            if (tags && Array.isArray(tags)) {
                for (const tagName of tags) {
                    // Check if tag exists, create if not
                    let tagResult = await query(
                        'SELECT id FROM recommendation_tags WHERE name = $1',
                        [tagName]
                    );

                    let tagId;
                    if (tagResult.rows.length === 0) {
                        const newTagResult = await query(
                            'INSERT INTO recommendation_tags (name) VALUES ($1) RETURNING id',
                            [tagName]
                        );
                        tagId = newTagResult.rows[0].id;
                    } else {
                        tagId = tagResult.rows[0].id;
                    }

                    // Link tag to recommendation
                    await query(
                        'INSERT INTO recommendation_tag_links (recommendation_id, tag_id) VALUES ($1, $2)',
                        [recommendationId, tagId]
                    );
                }
            }

            await query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Recommendation created successfully',
                data: { id: recommendationId }
            });
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error: any) {
        console.error('Create recommendation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create recommendation',
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

        const userId = (req as any).user?.id;

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
                    location = $4, address = $5, pros_points = $6, progress_percentage = $7,
                    latitude = $8, longitude = $9, best_time_to_visit = $10, 
                    duration_suggestion = $11, user_rating = $12, additional_notes = $13,
                    updated_at = NOW()
                WHERE id = $14
            `;

            await query(updateQuery, [
                place_name, description, category_id, location,
                address, pros_points, progress_percentage, latitude, longitude,
                best_time_to_visit, duration_suggestion, user_rating, additional_notes, id
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

                    let tagId;
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
        const userId = (req as any).user?.id;

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

        // Soft delete by setting status to 'deleted'
        await query(
            'UPDATE recommendations SET status = $1, updated_at = NOW() WHERE id = $2',
            ['deleted', id]
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
        const userId = (req as any).user?.id;

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

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const filename = generateFilename(file.originalname, userId, 'recommendation');
            const photoUrl = await processImage(file.buffer, 'recommendation', filename);
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

// Get cities
export const getCities = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        
        let citiesQuery = 'SELECT id, name, country, state_province FROM cities';
        let params: any[] = [];

        if (search) {
            citiesQuery += ' WHERE name ILIKE $1 OR country ILIKE $1';
            params.push(`%${search}%`);
        }

        citiesQuery += ' ORDER BY name LIMIT 50';

        const cities = await query(citiesQuery, params);

        res.json({
            success: true,
            data: cities.rows
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
