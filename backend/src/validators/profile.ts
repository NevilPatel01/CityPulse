import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Profile update schema
export const updateProfileSchema = z.object({
    bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
    currentLocation: z.string().max(100, 'Current location must be 100 characters or less').optional(),
    hometown: z.string().max(100, 'Hometown must be 100 characters or less').optional(),
    phone: z.string().max(20, 'Phone number must be 20 characters or less').optional(),
    instagramUrl: z.preprocess((val) => val === '' ? undefined : val, z.string().url('Invalid Instagram URL').optional()),
    facebookUrl: z.preprocess((val) => val === '' ? undefined : val, z.string().url('Invalid Facebook URL').optional()),
    twitterUrl: z.preprocess((val) => val === '' ? undefined : val, z.string().url('Invalid Twitter URL').optional()),
    linkedinUrl: z.preprocess((val) => val === '' ? undefined : val, z.string().url('Invalid LinkedIn URL').optional()),
    websiteUrl: z.preprocess((val) => val === '' ? undefined : val, z.string().url('Invalid Website URL').optional()),
    whatsappContact: z.string().max(50, 'WhatsApp contact must be 50 characters or less').optional(),
    profileVisibility: z.enum(['public', 'private'], {
        message: 'Profile visibility must be either public or private'
    }).optional(),
    locationSharing: z.boolean().optional(),
    socialLinksVisible: z.boolean().optional(),
    travelBuddyRequestsEnabled: z.boolean().optional(),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be 50 characters or less')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    citiesVisited: z.array(z.string()).optional()
});

// Username validation schema for profile viewing
export const usernameParamSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be 50 characters or less')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
});

// Profile photo upload validation
export const profilePhotoSchema = z.object({
    type: z.enum(['profile', 'cover'], {
        message: 'Photo type must be either profile or cover'
    })
});

// Middleware function to validate request data
export const validateProfile = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate request body
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Invalid request data'
            });
        }
    };
};

// Middleware to validate URL parameters
export const validateParams = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                
                return res.status(400).json({
                    success: false,
                    message: 'Invalid URL parameters',
                    errors
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Invalid request parameters'
            });
        }
    };
};

// Social media URL validation helper
export const validateSocialUrl = (url: string, platform: string): boolean => {
    if (!url) return true; // Empty URLs are allowed
    
    try {
        const urlObj = new URL(url);
        
        // Allow any valid URL for website
        if (platform === 'website') {
            return true;
        }
        
        switch (platform) {
            case 'instagram':
                return urlObj.hostname === 'www.instagram.com' || urlObj.hostname === 'instagram.com';
            case 'facebook':
                return urlObj.hostname === 'www.facebook.com' || urlObj.hostname === 'facebook.com' || urlObj.hostname === 'fb.com' || urlObj.hostname === 'm.facebook.com';
            case 'twitter':
                return urlObj.hostname === 'www.twitter.com' || urlObj.hostname === 'twitter.com' || urlObj.hostname === 'x.com' || urlObj.hostname === 'www.x.com';
            case 'linkedin':
                return urlObj.hostname === 'www.linkedin.com' || urlObj.hostname === 'linkedin.com';
            default:
                return true;
        }
    } catch {
        return false;
    }
};

// Custom validation for social media URLs
export const validateSocialUrls = (data: any) => {
    const errors: string[] = [];
    
    // Trim and check if URLs are not empty before validating
    const instagramUrl = data.instagramUrl?.trim();
    const facebookUrl = data.facebookUrl?.trim();
    const twitterUrl = data.twitterUrl?.trim();
    const linkedinUrl = data.linkedinUrl?.trim();
    const websiteUrl = data.websiteUrl?.trim();
    
    if (instagramUrl && instagramUrl.length > 0 && !validateSocialUrl(instagramUrl, 'instagram')) {
        errors.push('Instagram URL must be a valid Instagram profile URL (instagram.com)');
    }
    
    if (facebookUrl && facebookUrl.length > 0 && !validateSocialUrl(facebookUrl, 'facebook')) {
        errors.push('Facebook URL must be a valid Facebook profile URL (facebook.com)');
    }
    
    if (twitterUrl && twitterUrl.length > 0 && !validateSocialUrl(twitterUrl, 'twitter')) {
        errors.push('Twitter URL must be a valid Twitter/X profile URL (twitter.com or x.com)');
    }
    
    if (linkedinUrl && linkedinUrl.length > 0 && !validateSocialUrl(linkedinUrl, 'linkedin')) {
        errors.push('LinkedIn URL must be a valid LinkedIn profile URL (linkedin.com)');
    }
    
    // Allow any valid URL for website
    if (websiteUrl && websiteUrl.length > 0 && !validateSocialUrl(websiteUrl, 'website')) {
        errors.push('Website URL must be a valid URL');
    }
    
    return errors;
};