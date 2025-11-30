import { z } from 'zod';

// Create recommendation schema for travel places
export const createRecommendationSchema = z.object({
    // Basic Information
    place_name: z.string()
        .min(3, 'Place name must be at least 3 characters long')
        .max(200, 'Place name must not exceed 200 characters')
        .trim(),
    category_id: z.number()
        .int('Category ID must be an integer')
        .positive('Category ID must be positive')
        .optional(),
    custom_category: z.string()
        .min(2, 'Custom category must be at least 2 characters long')
        .max(50, 'Custom category must not exceed 50 characters')
        .trim()
        .optional(),
    city_id: z.number()
        .int('City ID must be an integer')
        .positive('City ID must be positive')
        .optional(),
    custom_city: z.string()
        .min(2, 'Custom city must be at least 2 characters long')
        .max(100, 'Custom city must not exceed 100 characters')
        .trim()
        .optional(),
    city_name: z.string()
        .max(100, 'City name must not exceed 100 characters')
        .trim()
        .optional(),
    address: z.string()
        .max(500, 'Address must not exceed 500 characters')
        .trim()
        .optional(),

    // Details
    description: z.string()
        .min(10, 'Description must be at least 10 characters long')
        .max(2000, 'Description must not exceed 2000 characters')
        .trim()
        .optional(),

    // Price range
    price_range_min: z.number()
        .min(0, 'Minimum price must be non-negative')
        .optional(),
    price_range_max: z.number()
        .min(0, 'Maximum price must be non-negative')
        .optional(),

    // Difficulty level
    difficulty_level: z.string()
        .max(20, 'Difficulty level must not exceed 20 characters')
        .trim()
        .optional(),

    // Timing Details
    best_time_to_visit: z.string()
        .max(100, 'Best time to visit must not exceed 100 characters')
        .trim()
        .optional(),
    duration_suggestion: z.string()
        .max(100, 'Duration suggestion must not exceed 100 characters')
        .trim()
        .optional(),
    user_rating: z.number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5'),

    // Geographic coordinates
    latitude: z.number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
        .optional(),
    longitude: z.number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .optional(),

    // Tags
    tags: z.array(z.string().min(1).max(50))
        .max(10, 'Maximum 10 tags allowed')
        .optional()
}).refine(
    (data) => {
        return data.category_id !== undefined || data.custom_category !== undefined;
    },
    {
        message: 'Either category_id or custom_category must be provided',
        path: ['category_id']
    }
).refine(
    (data) => {
        // Allow price range validation - if min is provided, max should be >= min
        if (data.price_range_min !== undefined && data.price_range_max !== undefined) {
            return data.price_range_max >= data.price_range_min;
        }
        return true;
    },
    {
        message: 'Maximum price must be greater than or equal to minimum price',
        path: ['price_range_max']
    }
);

// Update recommendation schema (all fields optional except id)
export const updateRecommendationSchema = createRecommendationSchema.partial();

// Get recommendations query schema
export const getRecommendationsSchema = z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional(),
    category_id: z.string().regex(/^\d+$/, 'Category ID must be a positive integer').optional(),
    city_id: z.string().regex(/^\d+$/, 'City ID must be a positive integer').optional(),
    user_id: z.string().regex(/^\d+$/, 'User ID must be a positive integer').optional(),
    search: z.string().max(100, 'Search term must not exceed 100 characters').optional()
});

// Get cities query schema
export const getCitiesSchema = z.object({
    search: z.string().max(100, 'Search term must not exceed 100 characters').optional()
});

// Preprocess form data to convert string numbers to actual numbers
const preprocessFormData = (body: any): any => {
    const processed = { ...body };
    
    // Fields that should be numbers
    const numberFields = ['category_id', 'city_id', 'price_range_min', 'price_range_max', 'user_rating', 'latitude', 'longitude'];
    
    for (const field of numberFields) {
        if (processed[field] !== undefined && processed[field] !== null && processed[field] !== '') {
            const num = Number(processed[field]);
            if (!isNaN(num)) {
                processed[field] = num;
            }
        }
    }
    
    return processed;
};

// Validation middleware
export const validate = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            // Preprocess form data if needed
            const processedBody = preprocessFormData(req.body);
            schema.parse(processedBody);
            // Update req.body with processed values
            req.body = processedBody;
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errorMessages
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid request data'
            });
        }
    };
};

// Query validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            schema.parse(req.query);
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    errors: errorMessages
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters'
            });
        }
    };
};

// Type exports
export type CreateRecommendationInput = z.infer<typeof createRecommendationSchema>;
export type UpdateRecommendationInput = z.infer<typeof updateRecommendationSchema>;
export type GetRecommendationsQuery = z.infer<typeof getRecommendationsSchema>;
export type GetCitiesQuery = z.infer<typeof getCitiesSchema>;
