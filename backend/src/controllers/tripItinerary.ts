import { Request, Response } from 'express';
import pool from '../lib/database';

/**
 * Trip Itinerary Controllers
 * Handles trip cities, itinerary items, recommendations, and comments
 */

// Add city to trip
export const addCityToTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { city_id, arrival_date, departure_date, notes } = req.body;

        // Check if user has permission (owner or accepted companion)
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips t
                LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
                WHERE t.id = $2 AND (t.user_id = $1 OR (tc.user_id = $1 AND tc.status = 'accepted'))`,
            [userId, id]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this trip'
            });
        }

        // Get current max visit_order
        const maxOrderResult = await pool.query(
            'SELECT COALESCE(MAX(visit_order), 0) as max_order FROM trip_cities WHERE trip_id = $1',
            [id]
        );
        const nextOrder = maxOrderResult.rows[0].max_order + 1;

        const result = await pool.query(
            `INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [id, city_id, arrival_date, departure_date, nextOrder, notes]
        );

        res.status(201).json({
            success: true,
            message: 'City added to trip',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding city to trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add city to trip'
        });
    }
};

// Update trip city
export const updateTripCity = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, cityId } = req.params;
        const updates = req.body;

        // Check permission
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips t
                LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
                WHERE t.id = $2 AND (t.user_id = $1 OR (tc.user_id = $1 AND tc.status = 'accepted'))`,
            [userId, id]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this trip'
            });
        }

        const allowedFields = ['arrival_date', 'departure_date', 'visit_order', 'notes'];
        const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
        const values = updateFields.map(field => updates[field]);

        const result = await pool.query(
            `UPDATE trip_cities 
                SET ${setClause}
                WHERE trip_id = $1 AND id = $2
             RETURNING *`,
            [id, cityId, ...values]
        );

        res.json({
            success: true,
            message: 'Trip city updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating trip city:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update trip city'
        });
    }
};

// Remove city from trip
export const removeCityFromTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, cityId } = req.params;

        // Check permission
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Only trip owner can remove cities'
            });
        }

        await pool.query(
            'DELETE FROM trip_cities WHERE trip_id = $1 AND id = $2',
            [id, cityId]
        );

        res.json({
            success: true,
            message: 'City removed from trip'
        });
    } catch (error) {
        console.error('Error removing city from trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove city from trip'
        });
    }
};

// Get trip itinerary
export const getTripItinerary = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                ti.*,
                tc.city_id,
                c.name as city_name,
                c.country,
                u.username as added_by_username,
                u.full_name as added_by_name
                FROM trip_itinerary ti
                LEFT JOIN trip_cities tc ON ti.trip_city_id = tc.id
                LEFT JOIN cities c ON tc.city_id = c.id
                LEFT JOIN users u ON ti.added_by = u.id
                WHERE ti.trip_id = $1
                ORDER BY ti.day_number, ti.time_slot`,
            [id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting trip itinerary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trip itinerary'
        });
    }
};

// Add itinerary item
export const addItineraryItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const {
            trip_city_id,
            day_number,
            activity_date,
            time_slot,
            title,
            description,
            activity_type,
            duration_minutes,
            estimated_cost,
            location_name,
            location_coordinates,
            status = 'planned',
            notes
        } = req.body;

        // Check permission
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips t
                LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
                WHERE t.id = $2 AND (t.user_id = $1 OR (tc.user_id = $1 AND tc.status = 'accepted'))`,
            [userId, id]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to add itinerary items'
            });
        }

        const result = await pool.query(
            `INSERT INTO trip_itinerary 
                (trip_id, trip_city_id, day_number, activity_date, time_slot, title, description, 
                activity_type, duration_minutes, estimated_cost, location_name, location_coordinates, 
                status, notes, added_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             RETURNING *`,
            [id, trip_city_id, day_number, activity_date, time_slot, title, description,
                activity_type, duration_minutes, estimated_cost, location_name, location_coordinates,
                status, notes, userId]
        );

        res.status(201).json({
            success: true,
            message: 'Itinerary item added',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding itinerary item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add itinerary item'
        });
    }
};

// Update itinerary item
export const updateItineraryItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, itemId } = req.params;
        const updates = req.body;

        // Check permission
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips t
                LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
                WHERE t.id = $2 AND (t.user_id = $1 OR (tc.user_id = $1 AND tc.status = 'accepted'))`,
            [userId, id]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this itinerary'
            });
        }

        const allowedFields = [
            'trip_city_id', 'day_number', 'activity_date', 'time_slot', 'title', 'description',
            'activity_type', 'duration_minutes', 'estimated_cost', 'location_name',
            'location_coordinates', 'status', 'notes'
        ];

        const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
        const values = updateFields.map(field => updates[field]);

        const result = await pool.query(
            `UPDATE trip_itinerary 
                SET ${setClause}, updated_at = NOW()
                WHERE trip_id = $1 AND id = $2
             RETURNING *`,
            [id, itemId, ...values]
        );

        res.json({
            success: true,
            message: 'Itinerary item updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating itinerary item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update itinerary item'
        });
    }
};

// Delete itinerary item
export const deleteItineraryItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, itemId } = req.params;

        // Check if user is owner or the one who added the item
        const permissionCheck = await pool.query(
            `SELECT t.user_id, ti.added_by
                FROM trip_itinerary ti
                JOIN trips t ON ti.trip_id = t.id
                WHERE ti.trip_id = $1 AND ti.id = $2`,
            [id, itemId]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Itinerary item not found'
            });
        }

        const isOwner = permissionCheck.rows[0].user_id === userId;
        const isAdder = permissionCheck.rows[0].added_by === userId;

        if (!isOwner && !isAdder) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own itinerary items or if you are the trip owner'
            });
        }

        await pool.query(
            'DELETE FROM trip_itinerary WHERE trip_id = $1 AND id = $2',
            [id, itemId]
        );

        res.json({
            success: true,
            message: 'Itinerary item deleted'
        });
    } catch (error) {
        console.error('Error deleting itinerary item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete itinerary item'
        });
    }
};

// Add recommendation to trip
export const addRecommendationToTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { recommendation_id, itinerary_id, status = 'wishlist', notes } = req.body;

        // Check permission
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips t
                LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
                WHERE t.id = $2 AND (t.user_id = $1 OR (tc.user_id = $1 AND tc.status = 'accepted'))`,
            [userId, id]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to add recommendations'
            });
        }

        const result = await pool.query(
            `INSERT INTO trip_recommendations 
                (trip_id, itinerary_id, recommendation_id, status, added_by, notes)
                VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [id, itinerary_id, recommendation_id, status, userId, notes]
        );

        res.status(201).json({
            success: true,
            message: 'Recommendation added to trip',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding recommendation to trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add recommendation to trip'
        });
    }
};

// Update trip recommendation
export const updateTripRecommendation = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, recId } = req.params;
        const { status, notes } = req.body;

        // Check permission
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips t
                LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
                WHERE t.id = $2 AND (t.user_id = $1 OR (tc.user_id = $1 AND tc.status = 'accepted'))`,
            [userId, id]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to modify this'
            });
        }

        const updates: string[] = [];
        const values: any[] = [id, recId];
        let paramCount = 2;

        if (status) {
            paramCount++;
            updates.push(`status = $${paramCount}`);
            values.push(status);
        }

        if (notes !== undefined) {
            paramCount++;
            updates.push(`notes = $${paramCount}`);
            values.push(notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        const result = await pool.query(
            `UPDATE trip_recommendations 
                SET ${updates.join(', ')}
                WHERE trip_id = $1 AND id = $2
             RETURNING *`,
            values
        );

        res.json({
            success: true,
            message: 'Trip recommendation updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating trip recommendation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update trip recommendation'
        });
    }
};

// Remove recommendation from trip
export const removeTripRecommendation = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, recId } = req.params;

        // Check permission
        const permissionCheck = await pool.query(
            `SELECT t.user_id, tr.added_by
                FROM trip_recommendations tr
                JOIN trips t ON tr.trip_id = t.id
                WHERE tr.trip_id = $1 AND tr.id = $2`,
            [id, recId]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip recommendation not found'
            });
        }

        const isOwner = permissionCheck.rows[0].user_id === userId;
        const isAdder = permissionCheck.rows[0].added_by === userId;

        if (!isOwner && !isAdder) {
            return res.status(403).json({
                success: false,
                message: 'You can only remove recommendations you added or if you are the trip owner'
            });
        }

        await pool.query(
            'DELETE FROM trip_recommendations WHERE trip_id = $1 AND id = $2',
            [id, recId]
        );

        res.json({
            success: true,
            message: 'Recommendation removed from trip'
        });
    } catch (error) {
        console.error('Error removing trip recommendation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove recommendation from trip'
        });
    }
};

// Get trip comments
export const getTripComments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
                tc.*,
                u.username,
                u.full_name,
                up.profile_photo_url
                FROM trip_comments tc
                JOIN users u ON tc.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE tc.trip_id = $1
                ORDER BY tc.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting trip comments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trip comments'
        });
    }
};

// Add trip comment
export const addTripComment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { comment_text } = req.body;

        if (!comment_text || comment_text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        // Check permission (owner or accepted companion)
        const permissionCheck = await pool.query(
            `SELECT 1 FROM trips t
                LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
                WHERE t.id = $2 AND (t.user_id = $1 OR (tc.user_id = $1 AND tc.status = 'accepted'))`,
            [userId, id]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to comment on this trip'
            });
        }

        const result = await pool.query(
            `INSERT INTO trip_comments (trip_id, user_id, comment_text)
                VALUES ($1, $2, $3)
                RETURNING *`,
            [id, userId, comment_text]
        );

        res.status(201).json({
            success: true,
            message: 'Comment added',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding trip comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment'
        });
    }
};

// Delete trip comment
export const deleteTripComment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, commentId } = req.params;

        // Check if user is owner of comment or trip owner
        const permissionCheck = await pool.query(
            `SELECT t.user_id as trip_owner, tc.user_id as comment_owner
                FROM trip_comments tc
                JOIN trips t ON tc.trip_id = t.id
                WHERE tc.trip_id = $1 AND tc.id = $2`,
            [id, commentId]
        );

        if (permissionCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        const isTripOwner = permissionCheck.rows[0].trip_owner === userId;
        const isCommentOwner = permissionCheck.rows[0].comment_owner === userId;

        if (!isTripOwner && !isCommentOwner) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own comments or if you are the trip owner'
            });
        }

        await pool.query(
            'DELETE FROM trip_comments WHERE trip_id = $1 AND id = $2',
            [id, commentId]
        );

        res.json({
            success: true,
            message: 'Comment deleted'
        });
    } catch (error) {
        console.error('Error deleting trip comment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment'
        });
    }
};
