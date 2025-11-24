import { Request, Response } from 'express';
import { query } from '../lib/database';

/**
 * Get travel preferences for authenticated user
 */
export const getTravelPreferences = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        const result = await query(
            `SELECT travel_style, activity_level, preferred_difficulty, interest_categories
             FROM travel_preferences
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Return default preferences if none exist
            return res.json({
                success: true,
                data: {
                    travel_style: [],
                    activity_level: 'moderate',
                    preferred_difficulty: 'medium',
                    interest_categories: []
                }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get travel preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get travel preferences'
        });
    }
};

/**
 * Update travel preferences for authenticated user
 */
export const updateTravelPreferences = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { travel_style, activity_level, preferred_difficulty, interest_categories } = req.body;

        // Check if preferences exist
        const existingResult = await query(
            'SELECT id FROM travel_preferences WHERE user_id = $1',
            [userId]
        );

        if (existingResult.rows.length === 0) {
            // Insert new preferences
            await query(
                `INSERT INTO travel_preferences (user_id, travel_style, activity_level, preferred_difficulty, interest_categories)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, travel_style || [], activity_level || 'moderate', preferred_difficulty || 'medium', interest_categories || []]
            );
        } else {
            // Update existing preferences
            await query(
                `UPDATE travel_preferences
                 SET travel_style = $2, activity_level = $3, preferred_difficulty = $4, interest_categories = $5, updated_at = NOW()
                 WHERE user_id = $1`,
                [userId, travel_style || [], activity_level, preferred_difficulty, interest_categories || []]
            );
        }

        res.json({
            success: true,
            message: 'Travel preferences updated successfully'
        });
    } catch (error) {
        console.error('Update travel preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update travel preferences'
        });
    }
};
