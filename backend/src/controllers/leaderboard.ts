import { Request, Response } from 'express';
import { query } from '../lib/database';

/**
 * Get leaderboard - Top users by achievement points
 * GET /api/leaderboard
 * Query params: limit (default: 10), type (default: 'all' - can be 'achievements', 'points', 'badges')
 */
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const { limit = 10, type = 'all' } = req.query;
        const limitNum = Math.min(parseInt(limit as string) || 10, 100); // Max 100

        let queryString = '';
        let params: any[] = [limitNum];

        switch (type) {
            case 'achievements':
                // Top users by number of completed achievements
                queryString = `
                    SELECT 
                        u.id,
                        u.username,
                        u.full_name,
                        up.profile_photo_url,
                        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) as achievements_count,
                        COUNT(DISTINCT ua.achievement_id) as total_achievements,
                        COALESCE(SUM(a.target_value) FILTER (WHERE ua.is_completed = TRUE), 0) as total_points
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    LEFT JOIN user_achievements ua ON u.id = ua.user_id
                    LEFT JOIN achievements a ON ua.achievement_id = a.id
                    WHERE u.account_status = 'active'
                    GROUP BY u.id, u.username, u.full_name, up.profile_photo_url
                    HAVING COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) > 0
                    ORDER BY achievements_count DESC, total_points DESC
                    LIMIT $1
                `;
                break;

            case 'points':
                // Top users by total achievement points
                queryString = `
                    SELECT 
                        u.id,
                        u.username,
                        u.full_name,
                        up.profile_photo_url,
                        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) as achievements_count,
                        COALESCE(SUM(a.target_value) FILTER (WHERE ua.is_completed = TRUE), 0) as total_points
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    LEFT JOIN user_achievements ua ON u.id = ua.user_id
                    LEFT JOIN achievements a ON ua.achievement_id = a.id
                    WHERE u.account_status = 'active'
                    GROUP BY u.id, u.username, u.full_name, up.profile_photo_url
                    HAVING COALESCE(SUM(a.target_value) FILTER (WHERE ua.is_completed = TRUE), 0) > 0
                    ORDER BY total_points DESC, achievements_count DESC
                    LIMIT $1
                `;
                break;

            case 'badges':
                // Top users by unique badges earned
                queryString = `
                    SELECT 
                        u.id,
                        u.username,
                        u.full_name,
                        up.profile_photo_url,
                        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) as achievements_count,
                        COUNT(DISTINCT a.achievement_type) FILTER (WHERE ua.is_completed = TRUE) as unique_badges
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    LEFT JOIN user_achievements ua ON u.id = ua.user_id
                    LEFT JOIN achievements a ON ua.achievement_id = a.id
                    WHERE u.account_status = 'active'
                    GROUP BY u.id, u.username, u.full_name, up.profile_photo_url
                    HAVING COUNT(DISTINCT a.achievement_type) FILTER (WHERE ua.is_completed = TRUE) > 0
                    ORDER BY unique_badges DESC, achievements_count DESC
                    LIMIT $1
                `;
                break;

            case 'engagement':
                // Top users by engagement (count of completed achievements/badges)
                queryString = `
                    SELECT 
                        u.id,
                        u.username,
                        u.full_name,
                        up.profile_photo_url,
                        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) AS unique_badges
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    LEFT JOIN user_achievements ua ON u.id = ua.user_id
                    WHERE u.account_status = 'active'
                    GROUP BY u.id, u.username, u.full_name, up.profile_photo_url
                    ORDER BY unique_badges DESC
                    LIMIT $1
                `;
                break;

            default:
                // Default: all-around leaderboard (achievements + points)
                queryString = `
                    SELECT 
                        u.id,
                        u.username,
                        u.full_name,
                        up.profile_photo_url,
                        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) as achievements_count,
                        COALESCE(SUM(a.target_value) FILTER (WHERE ua.is_completed = TRUE), 0) as total_points,
                        COUNT(DISTINCT a.achievement_type) FILTER (WHERE ua.is_completed = TRUE) as unique_badges
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    LEFT JOIN user_achievements ua ON u.id = ua.user_id
                    LEFT JOIN achievements a ON ua.achievement_id = a.id
                    WHERE u.account_status = 'active'
                    GROUP BY u.id, u.username, u.full_name, up.profile_photo_url
                    HAVING COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) > 0
                    ORDER BY achievements_count DESC, total_points DESC, unique_badges DESC
                    LIMIT $1
                `;
        }

        const result = await query(queryString, params);

        // Add rank to each user
        const leaderboard = result.rows.map((user, index) => ({
            rank: index + 1,
            ...user,
            achievements_count: parseInt(user.achievements_count) || 0,
            total_points: parseInt(user.total_points) || 0,
            unique_badges: parseInt(user.unique_badges) || 0
        }));

        res.json({
            success: true,
            data: {
                leaderboard,
                type,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get leaderboard'
        });
    }
};

/**
 * Get current user's leaderboard position
 * GET /api/leaderboard/me
 */
export const getMyLeaderboardPosition = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Get user's stats
        const userStatsResult = await query(
            `
                SELECT 
                    COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) as achievements_count,
                    COALESCE(SUM(a.target_value) FILTER (WHERE ua.is_completed = TRUE), 0) as total_points
                FROM user_achievements ua
                LEFT JOIN achievements a ON ua.achievement_id = a.id
                WHERE ua.user_id = $1
            `,
            [userId]
        );

        const userStats = userStatsResult.rows[0];
        const achievementsCount = parseInt(userStats.achievements_count) || 0;
        const totalPoints = parseInt(userStats.total_points) || 0;

        // Count how many users have more achievements/points
        const rankResult = await query(
            `
                SELECT COUNT(*) + 1 as rank
                FROM (
                    SELECT 
                        ua.user_id,
                        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) as achievements_count,
                        COALESCE(SUM(a.target_value) FILTER (WHERE ua.is_completed = TRUE), 0) as total_points
                    FROM user_achievements ua
                    LEFT JOIN achievements a ON ua.achievement_id = a.id
                    JOIN users u ON ua.user_id = u.id
                    WHERE u.account_status = 'active'
                    GROUP BY ua.user_id
                    HAVING 
                        COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) > $1
                        OR (
                            COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.is_completed = TRUE) = $1
                            AND COALESCE(SUM(a.target_value) FILTER (WHERE ua.is_completed = TRUE), 0) > $2
                        )
                ) as ranked_users
            `,
            [achievementsCount, totalPoints]
        );

        // If user has zero achievements and zero points, do not show a misleading rank
        const rank = (achievementsCount === 0 && totalPoints === 0)
            ? null
            : (parseInt(rankResult.rows[0].rank) || 0);

        res.json({
            success: true,
            data: {
                rank,
                achievements_count: achievementsCount,
                total_points: totalPoints
            }
        });

    } catch (error) {
        console.error('Get my leaderboard position error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get leaderboard position'
        });
    }
};

