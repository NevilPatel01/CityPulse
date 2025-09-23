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

        // Get user basic info
        const userResult = await query(
            `SELECT u.id, u.username, u.email, u.full_name, u.bio, u.current_location, 
                    u.hometown, u.phone, u.created_at, u.last_login,
                    up.profile_photo_url, up.cover_photo_url, up.instagram_url, 
                    up.facebook_url, up.whatsapp_contact, up.profile_visibility,
                    up.location_sharing, up.social_links_visible, up.travel_buddy_requests_enabled
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

        // Check privacy settings
        if (user.profile_visibility === 'private' && user.id !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'This profile is private'
            });
        }

        // Get user stats (for future implementation)
        const statsResult = await query(
            `SELECT 
                0 as cities_count,
                0 as recommendations_count,
                0 as travel_buddies_count,
                0 as points
             WHERE $1 = $1`, // Placeholder query for now
            [user.id]
        );

        const stats = statsResult.rows[0] || {
            cities_count: 0,
            recommendations_count: 0,
            travel_buddies_count: 0,
            points: 0
        };

        // Prepare response data
        const profileData = {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            bio: user.bio,
            currentLocation: user.current_location,
            hometown: user.hometown,
            profilePhotoUrl: user.profile_photo_url,
            coverPhotoUrl: user.cover_photo_url,
            createdAt: user.created_at,
            lastLogin: user.last_login,
            stats,
            // Only show sensitive data to profile owner
            ...(user.id === currentUserId && {
                email: user.email,
                phone: user.phone,
                instagramUrl: user.instagram_url,
                facebookUrl: user.facebook_url,
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
                    whatsapp: user.whatsapp_contact
                }
            }),
            isOwnProfile: user.id === currentUserId
        };

        res.json({
            success: true,
            data: { user: profileData }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
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
            whatsappContact,
            profileVisibility,
            locationSharing,
            socialLinksVisible,
            travelBuddyRequestsEnabled
        } = req.body;

        console.log(`[PROFILE] Updating profile for user: ${userId}`);

        // Validate social media URLs
        const socialUrlErrors = validateSocialUrls({
            instagramUrl,
            facebookUrl
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
                    user_id, instagram_url, facebook_url, whatsapp_contact,
                    profile_visibility, location_sharing, social_links_visible, 
                    travel_buddy_requests_enabled
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    userId,
                    instagramUrl || null,
                    facebookUrl || null,
                    whatsappContact || null,
                    profileVisibility || 'public',
                    locationSharing !== undefined ? locationSharing : true,
                    socialLinksVisible !== undefined ? socialLinksVisible : true,
                    travelBuddyRequestsEnabled !== undefined ? travelBuddyRequestsEnabled : true
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
            if (whatsappContact !== undefined) {
                profileUpdateFields.push(`whatsapp_contact = $${paramCount++}`);
                profileUpdateValues.push(whatsappContact || null);
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

        // Generate filename and process image
        const filename = generateFilename(req.file.originalname, userId, type as 'profile' | 'cover');
        const imagePath = await processImage(req.file.buffer, type as 'profile' | 'cover', filename);

        // Get current profile to delete old image
        const currentProfileResult = await query(
            `SELECT ${type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'} 
             FROM user_profiles WHERE user_id = $1`,
            [userId]
        );

        const oldImageUrl = currentProfileResult.rows[0]?.[type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'];

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
            // Update existing profile
            await query(
                `UPDATE user_profiles 
                 SET ${type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'} = $1, updated_at = NOW()
                 WHERE user_id = $2`,
                [imagePath, userId]
            );
        }

        // Delete old image file if it exists
        if (oldImageUrl) {
            await deleteOldImage(oldImageUrl);
        }

        res.json({
            success: true,
            message: `${type === 'profile' ? 'Profile' : 'Cover'} photo uploaded successfully`,
            data: {
                imageUrl: imagePath,
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
        res.status(500).json({
            success: false,
            message: 'Internal server error'
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