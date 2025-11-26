import { Request, Response } from 'express';
import { query } from '../lib/database';
import { processImage, generateFilename, deleteOldImage, validateImageFile, getImageMetadata } from '../utils/imageUpload';
import { validateSocialUrls } from '../validators/profile';

// Get user profile by username
export const getProfile = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user?.userId;

        console.log(`[PROFILE] Getting profile for username: ${username}`);
        console.log(`[PROFILE] Current user ID: ${currentUserId}`);

        // Get user basic info with profile data
        const userResult = await query(
            `SELECT u.id, u.username, u.email, u.full_name, u.bio, u.current_location, 
                    u.hometown, u.phone, u.created_at, u.last_login,
                    COALESCE(up.profile_photo_url, NULL) as profile_photo_url,
                    COALESCE(up.cover_photo_url, NULL) as cover_photo_url,
                    COALESCE(up.instagram_url, NULL) as instagram_url,
                    COALESCE(up.facebook_url, NULL) as facebook_url,
                    COALESCE(up.twitter_url, NULL) as twitter_url,
                    COALESCE(up.linkedin_url, NULL) as linkedin_url,
                    COALESCE(up.whatsapp_contact, NULL) as whatsapp_contact,
                    COALESCE(up.website_url, NULL) as website_url,
                    COALESCE(up.profile_visibility, 'public') as profile_visibility,
                    COALESCE(up.location_sharing, true) as location_sharing,
                    COALESCE(up.social_links_visible, true) as social_links_visible,
                    COALESCE(up.travel_buddy_requests_enabled, true) as travel_buddy_requests_enabled,
                    up.cities_visited
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.username = $1 AND u.account_status = 'active'`,
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Parse cities_visited from JSONB (user's manually added cities)
        let citiesVisitedFromProfile = [];
        try {
            if (user.cities_visited) {
                citiesVisitedFromProfile = typeof user.cities_visited === 'string'
                    ? JSON.parse(user.cities_visited)
                    : user.cities_visited;
            }
        } catch (error) {
            console.error('[PROFILE] Error parsing cities_visited:', error);
            citiesVisitedFromProfile = [];
        }

        // Get cities visited from user's recommendations
        const citiesResult = await query(
            `SELECT DISTINCT c.name, c.country
                FROM recommendations r
                JOIN recommendation_cities rc ON r.id = rc.recommendation_id
                JOIN cities c ON rc.city_id = c.id
                WHERE r.user_id = $1
                ORDER BY c.name`,
            [user.id]
        );

        const citiesFromRecommendations = citiesResult.rows.map(row => `${row.name}, ${row.country}`);

        // Combine both sources and remove duplicates
        const allCities = [...new Set([...citiesVisitedFromProfile, ...citiesFromRecommendations])];
        console.log('[PROFILE] Cities from profile:', citiesVisitedFromProfile);
        console.log('[PROFILE] Cities from recommendations:', citiesFromRecommendations);
        console.log('[PROFILE] Combined cities:', allCities);

        // If user_profiles record doesn't exist, create it with default values
        if (!user.profile_photo_url && user.id === currentUserId) {
            console.log(`[PROFILE] Creating user_profiles record for user: ${user.id}`);
            try {
                await query(
                    `INSERT INTO user_profiles (user_id) VALUES ($1)`,
                    [user.id]
                );
                console.log(`[PROFILE] User profiles record created for user: ${user.id}`);

                // Re-fetch user data with the new profile record
                const updatedUserResult = await query(
                    `SELECT u.id, u.username, u.email, u.full_name, u.bio, u.current_location, 
                            u.hometown, u.phone, u.created_at, u.last_login,
                            COALESCE(up.profile_photo_url, NULL) as profile_photo_url,
                            COALESCE(up.cover_photo_url, NULL) as cover_photo_url,
                            COALESCE(up.instagram_url, NULL) as instagram_url,
                            COALESCE(up.facebook_url, NULL) as facebook_url,
                            COALESCE(up.twitter_url, NULL) as twitter_url,
                            COALESCE(up.linkedin_url, NULL) as linkedin_url,
                            COALESCE(up.whatsapp_contact, NULL) as whatsapp_contact,
                            COALESCE(up.profile_visibility, 'public') as profile_visibility,
                            COALESCE(up.location_sharing, true) as location_sharing,
                            COALESCE(up.social_links_visible, true) as social_links_visible,
                            COALESCE(up.travel_buddy_requests_enabled, true) as travel_buddy_requests_enabled
                        FROM users u
                        LEFT JOIN user_profiles up ON u.id = up.user_id
                        WHERE u.username = $1 AND u.account_status = 'active'`,
                    [username]
                );

                if (updatedUserResult.rows.length > 0) {
                    Object.assign(user, updatedUserResult.rows[0]);
                }
            } catch (profileError) {
                console.error(`[PROFILE] Error creating user_profiles record:`, profileError);
                // Continue with default values if creation fails
            }
        }

        // Check privacy settings - allow travel buddies to view private profiles
        let isPrivateAccount = false;
        if (user.profile_visibility === 'private' && user.id !== currentUserId) {
            // Check if the current user is a travel buddy
            if (currentUserId) {
                const buddyCheckResult = await query(
                    `SELECT id FROM travel_buddy_connections
                     WHERE ((requester_id = $1 AND requested_id = $2) OR (requester_id = $2 AND requested_id = $1))
                     AND status = 'accepted'`,
                    [currentUserId, user.id]
                );

                // If they are travel buddies, allow full access
                if (buddyCheckResult.rows.length > 0) {
                    console.log(`[PROFILE] Allowing travel buddy ${currentUserId} to view private profile ${user.id}`);
                } else {
                    // Not a buddy, return limited profile data (Instagram-like)
                    console.log(`[PROFILE] Returning limited profile data for private account ${user.id}`);
                    isPrivateAccount = true;
                }
            } else {
                // Not authenticated, return limited profile data
                console.log(`[PROFILE] Returning limited profile data for unauthenticated user viewing private account ${user.id}`);
                isPrivateAccount = true;
            }
        }

        // If private account and not a buddy, return limited data
        if (isPrivateAccount) {
            const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:5001';
            const profilePhotoUrl = user.profile_photo_url ?
                (user.profile_photo_url.startsWith('http') ? user.profile_photo_url : `${baseUrl}${user.profile_photo_url}`) : null;

            // Check buddy request status
            let buddyRequestStatus = 'none';
            if (currentUserId) {
                const requestResult = await query(
                    `SELECT status FROM travel_buddy_connections
                     WHERE ((requester_id = $1 AND requested_id = $2) OR (requester_id = $2 AND requested_id = $1))`,
                    [currentUserId, user.id]
                );
                if (requestResult.rows.length > 0) {
                    buddyRequestStatus = requestResult.rows[0].status;
                }
            }

            return res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        fullName: user.full_name,
                        bio: user.bio,
                        profilePhotoUrl: profilePhotoUrl,
                        isPrivate: true,
                        buddyRequestStatus: buddyRequestStatus,
                        stats: {
                            cities: 0,
                            recommendations: 0,
                            travelBuddies: 0
                        }
                    }
                }
            });
        }

        // Get user stats from actual tables
        const statsResult = await query(
            `SELECT 
                (SELECT COUNT(*)
                    FROM recommendations
                    WHERE user_id = $1 AND status = 'active') as recommendations_count,
                (SELECT COUNT(*)
                    FROM travel_buddy_connections tbc
                    WHERE (tbc.requester_id = $1 OR tbc.requested_id = $1)
                    AND tbc.status = 'accepted') as travel_buddies_count
            FROM (SELECT $1::integer as user_id) u`,
            [user.id]
        );

        const stats = {
            cities_count: allCities.length, // Use the combined count
            recommendations_count: statsResult.rows[0]?.recommendations_count || 0,
            travel_buddies_count: statsResult.rows[0]?.travel_buddies_count || 0
        };

        // Get user badges - simplified for now
        const badgesResult = await query(
            `SELECT 
                id,
                name,
                description,
                badge_icon_url,
                achievement_type,
                target_value,
                0 as current_progress,
                false as is_completed,
                NULL as completed_at
            FROM achievements 
            WHERE is_active = true
            ORDER BY created_at
            LIMIT 3`,
            []
        );

        const userBadges = badgesResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            badgeIconUrl: row.badge_icon_url,
            achievementType: row.achievement_type,
            targetValue: row.target_value,
            currentProgress: row.current_progress,
            isCompleted: row.is_completed,
            completedAt: row.completed_at
        }));

        // Calculate profile completion status with proper null/undefined handling
        const requiredFields = [
            user.current_location,
            user.hometown
        ];
        const optionalFields = [
            user.bio,
            user.profile_photo_url,
            user.instagram_url,
            user.facebook_url,
            user.whatsapp_contact
        ];

        // Helper function to check if field has valid data
        const hasValidData = (field: any): boolean => {
            return field !== null && field !== undefined && field !== '' && field.trim() !== '';
        };

        const completedRequired = requiredFields.filter(hasValidData).length;
        const completedOptional = optionalFields.filter(hasValidData).length;
        const totalFields = requiredFields.length + optionalFields.length;
        const completedFields = completedRequired + completedOptional;
        const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
        const isProfileComplete = completedRequired === requiredFields.length;

        // Check if profile has minimum required data
        const hasMinimumData = user.id && user.username && user.full_name;
        const canDisplayProfile = hasMinimumData && isProfileComplete;

        // For incomplete profiles, only show to the owner or buddies
        console.log(`[PROFILE] Profile completion check: isComplete=${isProfileComplete}, user.id=${user.id}, currentUserId=${currentUserId}`);

        // Check if this is the user's own profile (by username match or user ID match)
        const isOwnProfile = currentUserId ? user.id === currentUserId : false;

        // Check if viewer is a buddy (for incomplete profile access)
        let isBuddy = false;
        if (!isOwnProfile && currentUserId) {
            const buddyCheckForIncomplete = await query(
                `SELECT id FROM travel_buddy_connections
                 WHERE ((requester_id = $1 AND requested_id = $2) OR (requester_id = $2 AND requested_id = $1))
                 AND status = 'accepted'`,
                [currentUserId, user.id]
            );
            isBuddy = buddyCheckForIncomplete.rows.length > 0;
        }

        // Special case: If user is not authenticated but profile is incomplete,
        // I'll allow access but mark it as incomplete for the frontend to handle
        if (!isProfileComplete && !currentUserId) {
            console.log(`[PROFILE] Unauthenticated access to incomplete profile - allowing with completion form`);
            // Don't block, let it continue to show the profile with completion status
        } else if (!isProfileComplete && !isOwnProfile && !isBuddy) {
            console.log(`[PROFILE] Blocking incomplete profile for non-owner and non-buddy`);
            return res.status(403).json({
                success: false,
                message: 'This user profile is incomplete and not available for viewing',
                code: 'PROFILE_INCOMPLETE'
            });
        } else if (!isProfileComplete && isBuddy) {
            console.log(`[PROFILE] Allowing buddy ${currentUserId} to view incomplete profile ${user.id}`);
        }

        // If profile is incomplete and it's the owner, allow access but mark as incomplete
        if (!isProfileComplete && isOwnProfile) {
            console.log(`[PROFILE] Incomplete profile for owner: ${user.id}, allowing access with completion form`);
        }

        // Prepare response data
        // Convert relative paths to full URLs for images
        const baseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:5001';
        const profilePhotoUrl = user.profile_photo_url ?
            (user.profile_photo_url.startsWith('http') ? user.profile_photo_url : `${baseUrl}${user.profile_photo_url}`) : null;
        const coverPhotoUrl = user.cover_photo_url ?
            (user.cover_photo_url.startsWith('http') ? user.cover_photo_url : `${baseUrl}${user.cover_photo_url}`) : null;

        const profileData = {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            bio: user.bio,
            currentLocation: user.current_location,
            hometown: user.hometown,
            profilePhotoUrl: profilePhotoUrl,
            coverPhotoUrl: coverPhotoUrl,
            citiesVisited: allCities, // Use combined cities list
            instagramUrl: user.instagram_url,
            facebookUrl: user.facebook_url,
            twitterUrl: user.twitter_url,
            linkedinUrl: user.linkedin_url,
            whatsappContact: user.whatsapp_contact,
            websiteUrl: user.website_url,
            email: user.email,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            stats: {
                cities: stats.cities_count,
                recommendations: stats.recommendations_count,
                travelBuddies: stats.travel_buddies_count
            },
            badges: userBadges,
            profileCompletion: {
                isComplete: isProfileComplete,
                percentage: completionPercentage,
                canBeDiscovered: canDisplayProfile,
                hasMinimumData: hasMinimumData,
                needsCompletion: !isProfileComplete
            },
            // Only show sensitive data to profile owner
            ...(user.id === currentUserId && {
                email: user.email,
                phone: user.phone,
                instagramUrl: user.instagram_url,
                facebookUrl: user.facebook_url,
                twitterUrl: user.twitter_url,
                linkedinUrl: user.linkedin_url,
                whatsappContact: user.whatsapp_contact,
                profileVisibility: user.profile_visibility,
                locationSharing: user.location_sharing,
                socialLinksVisible: user.social_links_visible,
                travelBuddyRequestsEnabled: user.travel_buddy_requests_enabled
            }),
            // Show social links based on visibility settings
            ...(user.social_links_visible && {
                socialLinks: {
                    instagram: user.instagram_url,
                    facebook: user.facebook_url,
                    twitter: user.twitter_url,
                    linkedin: user.linkedin_url,
                    whatsapp: user.whatsapp_contact
                }
            }),
            isOwnProfile: user.id === currentUserId
        };

        res.json({
            success: true,
            data: { user: profileData }
        });

    } catch (error: any) {
        console.error('Get profile error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position
        });

        // Handle specific database errors
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'Database connection failed. Please try again later.',
                code: 'DATABASE_ERROR'
            });
        }

        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({
                success: false,
                message: 'Data conflict. Please try again.',
                code: 'DATA_CONFLICT'
            });
        }

        if (error.code === '23503') { // Foreign key constraint violation
            return res.status(400).json({
                success: false,
                message: 'Invalid data reference. Please check your request.',
                code: 'INVALID_REFERENCE'
            });
        }

        if (error.code === '42P01') { // Undefined table
            return res.status(500).json({
                success: false,
                message: 'Database table not found. Please contact support.',
                code: 'TABLE_NOT_FOUND'
            });
        }

        if (error.code === '42703') { // Undefined column
            return res.status(500).json({
                success: false,
                message: 'Database column not found. Please contact support.',
                code: 'COLUMN_NOT_FOUND'
            });
        }

        // Handle rate limiting
        if (error.status === 429) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please wait a moment before trying again.',
                code: 'RATE_LIMITED',
                retryAfter: 60 // seconds
            });
        }

        // Generic server error
        res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
            code: 'INTERNAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;
        const {
            bio,
            currentLocation,
            hometown,
            phone,
            instagramUrl,
            facebookUrl,
            twitterUrl,
            linkedinUrl,
            whatsappContact,
            websiteUrl,
            profileVisibility,
            locationSharing,
            socialLinksVisible,
            travelBuddyRequestsEnabled,
            username,
            citiesVisited
        } = req.body;

        console.log(`[PROFILE] Updating profile for user: ${userId}`);
        console.log(`[PROFILE] Cities visited update:`, citiesVisited);

        // Validate username if provided
        if (username !== undefined) {
            // Check if username is valid format
            if (!/^[a-zA-Z0-9_]+$/.test(username) || username.length < 3 || username.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be 3-50 characters and contain only letters, numbers, and underscores'
                });
            }

            // Check if username is already taken by another user
            const existingUser = await query(
                'SELECT id FROM users WHERE username = $1 AND id != $2',
                [username, userId]
            );

            if (existingUser.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Username already exists. Please choose a different username.'
                });
            }
        }

        // Validate social media URLs
        const socialUrlErrors = validateSocialUrls({
            instagramUrl,
            facebookUrl,
            twitterUrl,
            linkedinUrl,
            websiteUrl
        });

        if (socialUrlErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid social media URLs',
                errors: socialUrlErrors
            });
        }

        // Update user basic info
        const userUpdateFields = [];
        const userUpdateValues = [];
        let paramCount = 1;

        if (bio !== undefined) {
            userUpdateFields.push(`bio = $${paramCount++}`);
            userUpdateValues.push(bio);
        }
        if (currentLocation !== undefined) {
            userUpdateFields.push(`current_location = $${paramCount++}`);
            userUpdateValues.push(currentLocation);
        }
        if (hometown !== undefined) {
            userUpdateFields.push(`hometown = $${paramCount++}`);
            userUpdateValues.push(hometown);
        }
        if (phone !== undefined) {
            userUpdateFields.push(`phone = $${paramCount++}`);
            userUpdateValues.push(phone);
        }
        if (username !== undefined) {
            userUpdateFields.push(`username = $${paramCount++}`);
            userUpdateValues.push(username);
        }

        userUpdateFields.push(`updated_at = NOW()`);
        userUpdateValues.push(userId);

        if (userUpdateFields.length > 1) { // More than just updated_at
            const userUpdateQuery = `
                UPDATE users 
                SET ${userUpdateFields.join(', ')}
                WHERE id = $${paramCount}
            `;
            await query(userUpdateQuery, userUpdateValues);
        }

        // Create or update user profile
        const profileResult = await query(
            'SELECT id FROM user_profiles WHERE user_id = $1',
            [userId]
        );

        if (profileResult.rows.length === 0) {
            // Create new profile
            await query(
                `INSERT INTO user_profiles (
                    user_id, instagram_url, facebook_url, twitter_url, linkedin_url, whatsapp_contact, website_url,
                    profile_visibility, location_sharing, social_links_visible, 
                    travel_buddy_requests_enabled, cities_visited
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    userId,
                    instagramUrl || null,
                    facebookUrl || null,
                    twitterUrl || null,
                    linkedinUrl || null,
                    whatsappContact || null,
                    websiteUrl || null,
                    profileVisibility || 'public',
                    locationSharing !== undefined ? locationSharing : true,
                    socialLinksVisible !== undefined ? socialLinksVisible : true,
                    travelBuddyRequestsEnabled !== undefined ? travelBuddyRequestsEnabled : true,
                    citiesVisited ? JSON.stringify(citiesVisited) : '[]'
                ]
            );
        } else {
            // Update existing profile
            const profileUpdateFields = [];
            const profileUpdateValues = [];
            paramCount = 1;

            if (instagramUrl !== undefined) {
                profileUpdateFields.push(`instagram_url = $${paramCount++}`);
                profileUpdateValues.push(instagramUrl || null);
            }
            if (facebookUrl !== undefined) {
                profileUpdateFields.push(`facebook_url = $${paramCount++}`);
                profileUpdateValues.push(facebookUrl || null);
            }
            if (twitterUrl !== undefined) {
                profileUpdateFields.push(`twitter_url = $${paramCount++}`);
                profileUpdateValues.push(twitterUrl || null);
            }
            if (linkedinUrl !== undefined) {
                profileUpdateFields.push(`linkedin_url = $${paramCount++}`);
                profileUpdateValues.push(linkedinUrl || null);
            }
            if (whatsappContact !== undefined) {
                profileUpdateFields.push(`whatsapp_contact = $${paramCount++}`);
                profileUpdateValues.push(whatsappContact || null);
            }
            if (websiteUrl !== undefined) {
                profileUpdateFields.push(`website_url = $${paramCount++}`);
                profileUpdateValues.push(websiteUrl || null);
            }
            if (profileVisibility !== undefined) {
                profileUpdateFields.push(`profile_visibility = $${paramCount++}`);
                profileUpdateValues.push(profileVisibility);
            }
            if (locationSharing !== undefined) {
                profileUpdateFields.push(`location_sharing = $${paramCount++}`);
                profileUpdateValues.push(locationSharing);
            }
            if (socialLinksVisible !== undefined) {
                profileUpdateFields.push(`social_links_visible = $${paramCount++}`);
                profileUpdateValues.push(socialLinksVisible);
            }
            if (travelBuddyRequestsEnabled !== undefined) {
                profileUpdateFields.push(`travel_buddy_requests_enabled = $${paramCount++}`);
                profileUpdateValues.push(travelBuddyRequestsEnabled);
            }
            if (citiesVisited !== undefined) {
                profileUpdateFields.push(`cities_visited = $${paramCount++}`);
                // Ensure citiesVisited is properly formatted as JSON
                const citiesJson = Array.isArray(citiesVisited) ? JSON.stringify(citiesVisited) : JSON.stringify([]);
                console.log(`[PROFILE] Updating cities_visited to:`, citiesJson);
                profileUpdateValues.push(citiesJson);
            }

            if (profileUpdateFields.length > 0) {
                profileUpdateFields.push(`updated_at = NOW()`);
                profileUpdateValues.push(userId);

                const profileUpdateQuery = `
                    UPDATE user_profiles 
                    SET ${profileUpdateFields.join(', ')}
                    WHERE user_id = $${paramCount}
                `;
                await query(profileUpdateQuery, profileUpdateValues);
            }
        }

        // Check and award achievements if cities_visited was updated
        if (citiesVisited !== undefined) {
            // Dynamically import to avoid circular dependency
            const { checkAndAwardAchievements } = await import('./achievements');
            checkAndAwardAchievements(userId, 'cities_visited').catch(err => {
                console.error('[PROFILE] Error checking cities_visited achievements:', err);
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Upload profile photo
export const uploadProfilePhoto = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.user.userId;
        const { type } = req.body; // 'profile' or 'cover'

        console.log(`[PROFILE] Uploading ${type} photo for user: ${userId}`);

        // Validate file
        const validation = validateImageFile(req.file);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error
            });
        }

        // Get image metadata
        const metadata = await getImageMetadata(req.file.buffer);
        console.log(`[PROFILE] Image metadata:`, metadata);

        // Generate filename and process image (new structure: uploads/{userId}/{type}/)
        const filename = generateFilename(req.file.originalname, type as 'profile' | 'cover');
        const imagePath = await processImage(
            req.file.buffer,
            userId,
            type as 'profile' | 'cover',
            filename
        );

        // Create profile if doesn't exist, or update existing one
        const profileExists = await query(
            'SELECT id FROM user_profiles WHERE user_id = $1',
            [userId]
        );

        if (profileExists.rows.length === 0) {
            // Create new profile
            await query(
                `INSERT INTO user_profiles (user_id, ${type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'}) 
                 VALUES ($1, $2)`,
                [userId, imagePath]
            );
        } else {
            // Update existing profile (old file is automatically deleted by processImage)
            await query(
                `UPDATE user_profiles 
                 SET ${type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'} = $1, updated_at = NOW()
                 WHERE user_id = $2`,
                [imagePath, userId]
            );
        }

        // Convert relative path to full URL
        // Try multiple environment variable sources for production compatibility
        const baseUrl = process.env.API_BASE_URL || 
                       process.env.BACKEND_URL || 
                       process.env.VITE_API_URL ||
                       (req.protocol + '://' + req.get('host')) ||
                       'http://localhost:5001';
        
        console.log('[PROFILE] Base URL for image:', baseUrl);
        console.log('[PROFILE] Image path:', imagePath);
        
        const fullImageUrl = `${baseUrl}${imagePath}`;
        console.log('[PROFILE] Full image URL:', fullImageUrl);

        // Set CORS headers for the response
        res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3001');
        res.header('Access-Control-Allow-Credentials', 'true');

        res.json({
            success: true,
            message: `${type === 'profile' ? 'Profile' : 'Cover'} photo uploaded successfully`,
            data: {
                imageUrl: fullImageUrl,
                relativePath: imagePath, // Also send relative path for debugging
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: metadata.size
                }
            }
        });

    } catch (error) {
        console.error('Upload profile photo error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({
            success: false,
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};

// Delete profile photo
export const deleteProfilePhoto = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;
        const { type } = req.params; // 'profile' or 'cover'

        if (!['profile', 'cover'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid photo type. Must be profile or cover'
            });
        }

        console.log(`[PROFILE] Deleting ${type} photo for user: ${userId}`);

        // Get current image URL
        const currentImageResult = await query(
            `SELECT ${type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'} as image_url
             FROM user_profiles WHERE user_id = $1`,
            [userId]
        );

        if (currentImageResult.rows.length === 0 || !currentImageResult.rows[0].image_url) {
            return res.status(404).json({
                success: false,
                message: `No ${type} photo found`
            });
        }

        const imageUrl = currentImageResult.rows[0].image_url;

        // Remove image URL from database
        await query(
            `UPDATE user_profiles 
             SET ${type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'} = NULL, updated_at = NOW()
             WHERE user_id = $1`,
            [userId]
        );

        // Delete image file
        await deleteOldImage(imageUrl);

        res.json({
            success: true,
            message: `${type === 'profile' ? 'Profile' : 'Cover'} photo deleted successfully`
        });

    } catch (error) {
        console.error('Delete profile photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = Number(req.user.userId);

        console.log(`[PROFILE] Getting stats for user: ${userId}`);

        const statsResult = await query(
            `SELECT 
                COALESCE(cities_visited.count, 0) as cities_count,
                COALESCE(recommendations.count, 0) as recommendations_count,
                COALESCE(travel_buddies.count, 0) as travel_buddies_count,
                0 as points
            FROM (
                SELECT COUNT(DISTINCT tc.city_id) as count 
                FROM trips t
                JOIN trip_cities tc ON t.id = tc.trip_id
                WHERE t.user_id = $1 AND t.status = 'completed'
            ) cities_visited,
            (
                SELECT COUNT(*) as count 
                FROM recommendations 
                WHERE user_id = $1 AND status = 'published'
            ) recommendations,
            (
                SELECT COUNT(*) as count 
                FROM travel_buddy_connections 
                WHERE (requester_id = $1 OR requested_id = $1) AND status = 'accepted'
            ) travel_buddies`,
            [userId]
        );

        const stats = statsResult.rows[0] || {
            cities_count: 0,
            recommendations_count: 0,
            travel_buddies_count: 0,
            points: 0
        };

        res.json({
            success: true,
            data: {
                cities: stats.cities_count,
                recommendations: stats.recommendations_count,
                travelBuddies: stats.travel_buddies_count,
                points: stats.points
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user badges
export const getUserBadges = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = Number(req.user.userId);

        console.log(`[PROFILE] Getting badges for user: ${userId}`);

        const badgesResult = await query(
            `SELECT 
                CASE 
                    WHEN cities_visited.count >= 20 THEN 'globetrotter'
                    WHEN cities_visited.count >= 10 THEN 'explorer'
                    WHEN cities_visited.count >= 5 THEN 'traveler'
                    ELSE NULL
                END as travel_badge,
                CASE 
                    WHEN recommendations.count >= 50 THEN 'expert_recommender'
                    WHEN recommendations.count >= 25 THEN 'active_recommender'
                    WHEN recommendations.count >= 10 THEN 'contributor'
                    ELSE NULL
                END as recommendation_badge,
                CASE 
                    WHEN travel_buddies.count >= 20 THEN 'social_butterfly'
                    WHEN travel_buddies.count >= 10 THEN 'connector'
                    WHEN travel_buddies.count >= 5 THEN 'buddy_maker'
                    ELSE NULL
                END as social_badge,
                NULL as points_badge
            FROM (
                SELECT COUNT(DISTINCT tc.city_id) as count 
                FROM trips t
                JOIN trip_cities tc ON t.id = tc.trip_id
                WHERE t.user_id = $1 AND t.status = 'completed'
            ) cities_visited,
            (
                SELECT COUNT(*) as count 
                FROM recommendations 
                WHERE user_id = $1 AND status = 'published'
            ) recommendations,
            (
                SELECT COUNT(*) as count 
                FROM travel_buddy_connections 
                WHERE (requester_id = $1 OR requested_id = $1) AND status = 'accepted'
            ) travel_buddies`,
            [userId]
        );

        const badges = badgesResult.rows[0] || {};
        const userBadges = Object.values(badges).filter(badge => badge !== null);

        // Badge definitions with icons and descriptions
        const badgeDefinitions = {
            globetrotter: { icon: '🌍', label: 'Globetrotter', description: 'Visited 20+ cities' },
            explorer: { icon: '🧭', label: 'Explorer', description: 'Visited 10+ cities' },
            traveler: { icon: '✈️', label: 'Traveler', description: 'Visited 5+ cities' },
            expert_recommender: { icon: '⭐', label: 'Expert', description: '50+ recommendations' },
            active_recommender: { icon: '📝', label: 'Active', description: '25+ recommendations' },
            contributor: { icon: '💡', label: 'Contributor', description: '10+ recommendations' },
            social_butterfly: { icon: '🦋', label: 'Social Butterfly', description: '20+ travel buddies' },
            connector: { icon: '🤝', label: 'Connector', description: '10+ travel buddies' },
            buddy_maker: { icon: '👥', label: 'Buddy Maker', description: '5+ travel buddies' },
            elite: { icon: '👑', label: 'Elite', description: '10,000+ points' },
            veteran: { icon: '🏆', label: 'Veteran', description: '5,000+ points' },
            enthusiast: { icon: '🔥', label: 'Enthusiast', description: '1,000+ points' }
        };

        const badgesWithDetails = userBadges.map(badge => ({
            id: badge,
            ...badgeDefinitions[badge as keyof typeof badgeDefinitions]
        }));

        res.json({
            success: true,
            data: { badges: badgesWithDetails }
        });

    } catch (error) {
        console.error('Get user badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get privacy settings
export const getPrivacySettings = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;

        const result = await query(
            `SELECT 
                profile_visibility,
                location_sharing,
                social_links_visible,
                travel_buddy_requests_enabled
             FROM user_profiles
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Return defaults if no profile exists
            return res.json({
                success: true,
                data: {
                    profileVisibility: 'public',
                    locationSharing: true,
                    socialLinksVisible: true,
                    travelBuddyRequestsEnabled: true
                }
            });
        }

        const settings = result.rows[0];

        res.json({
            success: true,
            data: {
                profileVisibility: settings.profile_visibility || 'public',
                locationSharing: settings.location_sharing !== undefined ? settings.location_sharing : true,
                socialLinksVisible: settings.social_links_visible !== undefined ? settings.social_links_visible : true,
                travelBuddyRequestsEnabled: settings.travel_buddy_requests_enabled !== undefined ? settings.travel_buddy_requests_enabled : true
            }
        });

    } catch (error) {
        console.error('Get privacy settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch privacy settings'
        });
    }
};

// Update privacy settings
export const updatePrivacySettings = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;
        const {
            profileVisibility,
            locationSharing,
            socialLinksVisible,
            travelBuddyRequestsEnabled
        } = req.body;

        // Validate profile visibility
        if (profileVisibility && !['public', 'private'].includes(profileVisibility)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile visibility value. Must be "public" or "private"'
            });
        }

        // Check if profile exists
        const profileCheck = await query(
            'SELECT id FROM user_profiles WHERE user_id = $1',
            [userId]
        );

        if (profileCheck.rows.length === 0) {
            // Create profile with privacy settings
            await query(
                `INSERT INTO user_profiles (
                    user_id, profile_visibility, location_sharing, 
                    social_links_visible, travel_buddy_requests_enabled
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                    userId,
                    profileVisibility || 'public',
                    locationSharing !== undefined ? locationSharing : true,
                    socialLinksVisible !== undefined ? socialLinksVisible : true,
                    travelBuddyRequestsEnabled !== undefined ? travelBuddyRequestsEnabled : true
                ]
            );
        } else {
            // Update privacy settings
            const updateFields = [];
            const updateValues = [];
            let paramCount = 1;

            if (profileVisibility !== undefined) {
                updateFields.push(`profile_visibility = $${paramCount++}`);
                updateValues.push(profileVisibility);
            }
            if (locationSharing !== undefined) {
                updateFields.push(`location_sharing = $${paramCount++}`);
                updateValues.push(locationSharing);
            }
            if (socialLinksVisible !== undefined) {
                updateFields.push(`social_links_visible = $${paramCount++}`);
                updateValues.push(socialLinksVisible);
            }
            if (travelBuddyRequestsEnabled !== undefined) {
                updateFields.push(`travel_buddy_requests_enabled = $${paramCount++}`);
                updateValues.push(travelBuddyRequestsEnabled);
            }

            if (updateFields.length > 0) {
                updateFields.push(`updated_at = NOW()`);
                updateValues.push(userId);

                const updateQuery = `
                    UPDATE user_profiles 
                    SET ${updateFields.join(', ')}
                    WHERE user_id = $${paramCount}
                `;
                await query(updateQuery, updateValues);
            }
        }

        res.json({
            success: true,
            message: 'Privacy settings updated successfully'
        });

    } catch (error) {
        console.error('Update privacy settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update privacy settings'
        });
    }
};

// Get email preferences
export const getEmailPreferences = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;

        // Check if preferences exist
        const result = await query(
            `SELECT buddy_requests, recommendations, trips, achievements, 
                    weekly_digest, marketing
             FROM email_preferences 
             WHERE user_id = $1`,
            [userId]
        );

        // If no preferences exist, return defaults
        const preferences = result.rows[0] || {
            buddy_requests: true,
            recommendations: true,
            trips: true,
            achievements: true,
            weekly_digest: false,
            marketing: false
        };

        res.json({
            success: true,
            data: {
                buddyRequests: preferences.buddy_requests,
                recommendations: preferences.recommendations,
                trips: preferences.trips,
                achievements: preferences.achievements,
                weeklyDigest: preferences.weekly_digest,
                marketing: preferences.marketing
            }
        });

    } catch (error) {
        console.error('Get email preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email preferences'
        });
    }
};

// Update email preferences
export const updateEmailPreferences = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;
        const {
            buddyRequests,
            recommendations,
            trips,
            achievements,
            weeklyDigest,
            marketing
        } = req.body;

        // Check if preferences exist
        const preferencesCheck = await query(
            'SELECT id FROM email_preferences WHERE user_id = $1',
            [userId]
        );

        if (preferencesCheck.rows.length === 0) {
            // Create email preferences
            await query(
                `INSERT INTO email_preferences (
                    user_id, buddy_requests, recommendations, trips, 
                    achievements, weekly_digest, marketing
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    userId,
                    buddyRequests !== undefined ? buddyRequests : true,
                    recommendations !== undefined ? recommendations : true,
                    trips !== undefined ? trips : true,
                    achievements !== undefined ? achievements : true,
                    weeklyDigest !== undefined ? weeklyDigest : false,
                    marketing !== undefined ? marketing : false
                ]
            );
        } else {
            // Update email preferences
            const updateFields = [];
            const updateValues = [];
            let paramCount = 1;

            if (buddyRequests !== undefined) {
                updateFields.push(`buddy_requests = $${paramCount++}`);
                updateValues.push(buddyRequests);
            }
            if (recommendations !== undefined) {
                updateFields.push(`recommendations = $${paramCount++}`);
                updateValues.push(recommendations);
            }
            if (trips !== undefined) {
                updateFields.push(`trips = $${paramCount++}`);
                updateValues.push(trips);
            }
            if (achievements !== undefined) {
                updateFields.push(`achievements = $${paramCount++}`);
                updateValues.push(achievements);
            }
            if (weeklyDigest !== undefined) {
                updateFields.push(`weekly_digest = $${paramCount++}`);
                updateValues.push(weeklyDigest);
            }
            if (marketing !== undefined) {
                updateFields.push(`marketing = $${paramCount++}`);
                updateValues.push(marketing);
            }

            if (updateFields.length > 0) {
                updateFields.push(`updated_at = NOW()`);
                updateValues.push(userId);

                const updateQuery = `
                    UPDATE email_preferences 
                    SET ${updateFields.join(', ')}
                    WHERE user_id = $${paramCount}
                `;
                await query(updateQuery, updateValues);
            }
        }

        res.json({
            success: true,
            message: 'Email preferences updated successfully'
        });

    } catch (error) {
        console.error('Update email preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email preferences'
        });
    }
};

// Request account data deletion
export const requestDataDeletion = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get user email for notification
        const userResult = await query('SELECT email, username FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = userResult.rows[0];

        // Mark user for deletion
        await query('UPDATE users SET account_status = $1 WHERE id = $2', ['pending_deletion', userId]);

        console.log(`[DATA DELETION] User ${user.username} (${userId}) requested account deletion`);

        return res.status(200).json({
            success: true,
            message: 'Your data deletion request has been received. Your account will be deleted within 30 days.'
        });
    } catch (error) {
        console.error('[DATA DELETION REQUEST]', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process deletion request'
        });
    }
};
