/**
 * Recalculate Achievements Script
 * This script recalculates and awards achievements for all existing users
 * Run this to backfill achievements for users who created content before achievement tracking
 */

import { query } from '../lib/database';

interface AchievementType {
    id: number;
    name: string;
    achievement_type: string;
    target_value: number;
}

async function recalculateAchievements() {
    try {

        // Get all active achievements
        const achievementsResult = await query(
            'SELECT id, name, achievement_type, target_value FROM achievements WHERE is_active = TRUE'
        );
        const achievements: AchievementType[] = achievementsResult.rows;


        // Get all users
        const usersResult = await query('SELECT id, username FROM users');
        const users = usersResult.rows;


        let totalAwarded = 0;
        let totalUpdated = 0;

        for (const user of users) {

            // Calculate stats for each achievement type
            const userStats: { [key: string]: number } = {};

            // Recommendations created
            const recResult = await query(
                'SELECT COUNT(*) as count FROM recommendations WHERE user_id = $1',
                [user.id]
            );
            userStats.recommendations_created = parseInt(recResult.rows[0].count);

            // Cities visited
            const cityResult = await query(
                'SELECT COUNT(DISTINCT city_id) as count FROM recommendation_cities rc JOIN recommendations r ON rc.recommendation_id = r.id WHERE r.user_id = $1',
                [user.id]
            );
            userStats.cities_visited = parseInt(cityResult.rows[0].count);

            // Travel buddies connected
            const buddyResult = await query(
                'SELECT COUNT(*) as count FROM travel_buddy_connections WHERE (requester_id = $1 OR requested_id = $1) AND status = $2',
                [user.id, 'accepted']
            );
            userStats.travel_buddies_connected = parseInt(buddyResult.rows[0].count);

            // Ratings received
            const ratingResult = await query(
                `SELECT COUNT(*) as count 
                 FROM recommendation_ratings rr
                 JOIN recommendations r ON rr.recommendation_id = r.id
                 WHERE r.user_id = $1`,
                [user.id]
            );
            userStats.ratings_received = parseInt(ratingResult.rows[0].count);

            // Likes received
            const likeResult = await query(
                `SELECT COUNT(*) as count 
                 FROM recommendation_likes rl
                 JOIN recommendations r ON rl.recommendation_id = r.id
                 WHERE r.user_id = $1`,
                [user.id]
            );
            userStats.likes_received = parseInt(likeResult.rows[0].count);


            // Process each achievement
            for (const achievement of achievements) {
                const currentValue = userStats[achievement.achievement_type] || 0;
                const isCompleted = currentValue >= achievement.target_value;

                // Check if user already has this achievement record
                const existingResult = await query(
                    'SELECT id, current_progress, is_completed FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
                    [user.id, achievement.id]
                );

                if (existingResult.rows.length === 0) {
                    // Create new record
                    await query(
                        `INSERT INTO user_achievements (user_id, achievement_id, current_progress, is_completed, completed_at)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [user.id, achievement.id, currentValue, isCompleted, isCompleted ? new Date() : null]
                    );

                    if (isCompleted) {
                        totalAwarded++;
                    } else if (currentValue > 0) {
                    }
                } else {
                    // Update existing record
                    const existing = existingResult.rows[0];
                    
                    if (existing.current_progress !== currentValue || existing.is_completed !== isCompleted) {
                        await query(
                            `UPDATE user_achievements 
                             SET current_progress = $1, 
                                 is_completed = $2, 
                                 completed_at = CASE WHEN $2 = TRUE AND is_completed = FALSE THEN NOW() ELSE completed_at END,
                                 updated_at = NOW()
                             WHERE user_id = $3 AND achievement_id = $4`,
                            [currentValue, isCompleted, user.id, achievement.id]
                        );

                        if (isCompleted && !existing.is_completed) {
                            totalAwarded++;
                        } else {
                            totalUpdated++;
                        }
                    }
                }
            }
        }


    } catch (error) {
        console.error('Error recalculating achievements:', error);
        throw error;
    }
}

// Run the script if executed directly
if (require.main === module) {
    recalculateAchievements()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Achievement recalculation failed:', error);
            process.exit(1);
        });
}

export { recalculateAchievements };
