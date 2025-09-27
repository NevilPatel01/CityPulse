import { z } from 'zod';

// Create recommendation schema
export const createRecommendationSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters long')
        .max(200, 'Title must not exceed 200 characters')
        .trim(),
    description: z.string()
        .min(10, 'Description must be at least 10 characters long')
        .max(2000, 'Description must not exceed 2000 characters')
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
    price_range_min: z.number()
        .min(0, 'Minimum price cannot be negative')
        .optional(),
    price_range_max: z.number()
        .min(0, 'Maximum price cannot be negative')
        .optional(),
    difficulty_level: z.enum(['easy', 'medium', 'hard'], {
        errorMap: () => ({ message: 'Difficulty level must be easy, medium, or hard' })
    }).optional(),
    address: z.string()
        .max(500, 'Address must not exceed 500 characters')
        .trim()
        .optional(),
    latitude: z.number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
        .optional(),
    longitude: z.number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .optional(),
    best_time_to_visit: z.string()
        .max(100, 'Best time to visit must not exceed 100 characters')
        .trim()
        .optional(),
    duration_suggestion: z.string()
        .max(50, 'Duration suggestion must not exceed 50 characters')
        .trim()
        .optional(),
    user_rating: z.number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5')
        .optional(),
    tags: z.array(z.string().trim().min(1, 'Tag cannot be empty'))
        .max(10, 'Maximum 10 tags allowed')
        .optional()
}).refine(
    (data) => {
        if (data.price_range_min !== undefined && data.price_range_max !== undefined) {
            return data.price_range_min <= data.price_range_max;
        }
        return true;
    },
    {
        message: 'Minimum price cannot be greater than maximum price',
        path: ['price_range_min']
    }
).refine(
    (data) => {
        return data.category_id !== undefined || data.custom_category !== undefined;
    },
    {
        message: 'Either category_id or custom_category must be provided',
        path: ['category_id']
    }
).refine(
    (data) => {
        return data.city_id !== undefined || data.custom_city !== undefined;
    },
    {
        message: 'Either city_id or custom_city must be provided',
        path: ['city_id']
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

// Validation middleware
export const validate = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.errors.map(err => ({
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
                const errorMessages = error.errors.map(err => ({
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
