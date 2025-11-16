import { Request, Response } from 'express';
import { query } from '../lib/database';

/**
 * Achievement Controller
 * Handles all badge/achievement related operations
 */

// Get all available achievements
export const getAllAchievements = async (req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT 
                id,
                name,
                description,
                badge_icon_url,
                achievement_type,
                target_value,
                is_active,
                created_at
            FROM achievements
            WHERE is_active = TRUE
            ORDER BY target_value ASC, name ASC`
        );

        res.json({
            success: true,
            data: {
                achievements: result.rows
            }
        });

    } catch (error) {
        console.error('Get all achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user's achievements (earned and in-progress)
export const getUserAchievements = async (req: Request, res: Response) => {
    try {
        const { username } = req.params;

        // Get user ID from username
        const userResult = await query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userId = userResult.rows[0].id;

        // Get user achievements with progress
        const achievementsResult = await query(
            `SELECT 
                a.id,
                a.name,
                a.description,
                a.badge_icon_url,
                a.achievement_type,
                a.target_value,
                ua.current_progress,
                ua.is_completed,
                ua.completed_at,
                ROUND((ua.current_progress::DECIMAL / a.target_value) * 100, 2) as progress_percentage
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            WHERE a.is_active = TRUE
            ORDER BY ua.is_completed DESC NULLS LAST, progress_percentage DESC, a.target_value ASC`,
            [userId]
        );

        // Separate completed and in-progress achievements
        const completed = achievementsResult.rows.filter(a => a.is_completed);
        const inProgress = achievementsResult.rows.filter(a => !a.is_completed);

        res.json({
            success: true,
            data: {
                completed,
                inProgress,
                stats: {
                    totalAchievements: achievementsResult.rows.length,
                    completedCount: completed.length,
                    completionRate: achievementsResult.rows.length > 0 
                        ? Math.round((completed.length / achievementsResult.rows.length) * 100)
                        : 0
                }
            }
        });

    } catch (error) {
        console.error('Get user achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get achievement progress for current user
export const getMyAchievementProgress = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;

        // Get all achievements with user's progress
        const result = await query(
            `SELECT 
                a.id,
                a.name,
                a.description,
                a.badge_icon_url,
                a.achievement_type,
                a.target_value,
                COALESCE(ua.current_progress, 0) as current_progress,
                COALESCE(ua.is_completed, FALSE) as is_completed,
                ua.completed_at,
                ROUND((COALESCE(ua.current_progress, 0)::DECIMAL / a.target_value) * 100, 2) as progress_percentage
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            WHERE a.is_active = TRUE
            ORDER BY ua.is_completed DESC NULLS LAST, progress_percentage DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                achievements: result.rows
            }
        });

    } catch (error) {
        console.error('Get achievement progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Check and award achievements for a user
export const checkAndAwardAchievements = async (userId: number, achievementType: string) => {
    try {
        console.log(`[ACHIEVEMENTS] Checking achievements for user ${userId}, type: ${achievementType}`);

        // Get user stats based on achievement type
        let currentValue = 0;

        switch (achievementType) {
            case 'recommendations_created':
                const recResult = await query(
                    'SELECT COUNT(*) as count FROM recommendations WHERE user_id = $1',
                    [userId]
                );
                currentValue = parseInt(recResult.rows[0].count);
                break;

            case 'cities_visited':
                const cityResult = await query(
                    `SELECT jsonb_array_length(COALESCE(cities_visited, '[]'::jsonb)) as count 
                     FROM user_profiles WHERE user_id = $1`,
                    [userId]
                );
                currentValue = cityResult.rows.length > 0 ? parseInt(cityResult.rows[0].count || '0') : 0;
                break;

            case 'travel_buddies_connected':
                const buddyResult = await query(
                    'SELECT COUNT(*) as count FROM travel_buddy_connections WHERE (requester_id = $1 OR requested_id = $1) AND status = $2',
                    [userId, 'accepted']
                );
                currentValue = parseInt(buddyResult.rows[0].count);
                break;

            case 'ratings_received':
                const ratingResult = await query(
                    `SELECT COUNT(*) as count 
                        FROM recommendation_ratings rr
                        JOIN recommendations r ON rr.recommendation_id = r.id
                        WHERE r.user_id = $1`,
                    [userId]
                );
                currentValue = parseInt(ratingResult.rows[0].count);
                break;

            case 'likes_received':
                const likeResult = await query(
                    `SELECT COUNT(*) as count 
                        FROM recommendation_likes rl
                        JOIN recommendations r ON rl.recommendation_id = r.id
                        WHERE r.user_id = $1`,
                    [userId]
                );
                currentValue = parseInt(likeResult.rows[0].count);
                break;

            default:
                console.log(`[ACHIEVEMENTS] Unknown achievement type: ${achievementType}`);
                return [];
        }

        console.log(`[ACHIEVEMENTS] Current value for ${achievementType}: ${currentValue}`);

        // Get all achievements of this type
        const achievementsResult = await query(
            'SELECT id, name, target_value FROM achievements WHERE achievement_type = $1 AND is_active = TRUE',
            [achievementType]
        );

        const newlyEarned = [];

        for (const achievement of achievementsResult.rows) {
            // Check if user already has this achievement
            const userAchResult = await query(
                'SELECT id, current_progress, is_completed FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
                [userId, achievement.id]
            );

            if (userAchResult.rows.length === 0) {
                // Create new user achievement record
                const isCompleted = currentValue >= achievement.target_value;
                await query(
                    `INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_completed, completed_at)
                        VALUES ($1, $2, $3, $4, $5)`,
                    [userId, achievement.id, currentValue, isCompleted, isCompleted ? new Date() : null]
                );

                if (isCompleted) {
                    console.log(`[ACHIEVEMENTS] ✨ User ${userId} earned achievement: ${achievement.name}`);
                    newlyEarned.push({
                        id: achievement.id,
                        name: achievement.name
                    });
                }
            } else {
                // Update existing achievement
                const userAch = userAchResult.rows[0];
                
                if (!userAch.is_completed && currentValue >= achievement.target_value) {
                    // Achievement just completed!
                    await query(
                        `UPDATE user_achievements 
                            SET current_progress = $1, is_completed = TRUE, completed_at = NOW(), updated_at = NOW()
                            WHERE user_id = $2 AND achievement_id = $3`,
                        [currentValue, userId, achievement.id]
                    );

                    console.log(`[ACHIEVEMENTS] ✨ User ${userId} earned achievement: ${achievement.name}`);
                    newlyEarned.push({
                        id: achievement.id,
                        name: achievement.name
                    });
                } else if (userAch.current_progress !== currentValue) {
                    // Update progress
                    await query(
                        `UPDATE user_achievements 
                            SET current_progress = $1, updated_at = NOW()
                            WHERE user_id = $2 AND achievement_id = $3`,
                        [currentValue, userId, achievement.id]
                    );
                }
            }
        }

        return newlyEarned;

    } catch (error) {
        console.error('[ACHIEVEMENTS] Error checking achievements:', error);
        return [];
    }
};

// Get recently earned achievements across all users (for showcase)
export const getRecentAchievements = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await query(
            `SELECT 
                ua.completed_at,
                a.name as achievement_name,
                a.description as achievement_description,
                a.badge_icon_url,
                u.username,
                u.full_name
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            JOIN users u ON ua.user_id = u.id
            WHERE ua.is_completed = TRUE
            ORDER BY ua.completed_at DESC
            LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            data: {
                recentAchievements: result.rows
            }
        });

    } catch (error) {
        console.error('Get recent achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get achievement statistics
export const getAchievementStats = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userId = req.user.userId;

        // Get total achievements
        const totalResult = await query(
            'SELECT COUNT(*) as count FROM achievements WHERE is_active = TRUE'
        );

        // Get completed achievements
        const completedResult = await query(
            'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND is_completed = TRUE',
            [userId]
        );

        // Get in-progress achievements
        const inProgressResult = await query(
            'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND is_completed = FALSE',
            [userId]
        );

        // Get achievements by type
        const byTypeResult = await query(
            `SELECT 
                a.achievement_type,
                COUNT(CASE WHEN ua.is_completed = TRUE THEN 1 END) as completed_count,
                COUNT(*) as total_count
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
            WHERE a.is_active = TRUE
            GROUP BY a.achievement_type`,
            [userId]
        );

        const totalAchievements = parseInt(totalResult.rows[0].count);
        const completedCount = parseInt(completedResult.rows[0].count);

        res.json({
            success: true,
            data: {
                totalAchievements,
                completedCount,
                inProgressCount: parseInt(inProgressResult.rows[0].count),
                completionRate: totalAchievements > 0 
                    ? Math.round((completedCount / totalAchievements) * 100)
                    : 0,
                byType: byTypeResult.rows
            }
        });

    } catch (error) {
        console.error('Get achievement stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
