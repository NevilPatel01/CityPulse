import { Request, Response } from 'express';
import pool from '../lib/database';

/**
 * Trip Controllers
 * Handles CRUD operations for trips, collaborative planning, and privacy
 */

// Get all trips for a user (created + participating)
export const getUserTrips = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { status, privacy } = req.query;

        let query = `
            SELECT 
                t.*,
                u.username as creator_username,
                u.full_name as creator_name,
                up.profile_photo_url as creator_photo,
                (SELECT COUNT(*) FROM trip_companions WHERE trip_id = t.id AND status = 'accepted') as companions_count,
                (SELECT COUNT(*) FROM trip_cities WHERE trip_id = t.id) as cities_count,
                (SELECT json_agg(json_build_object(
                    'id', c.id,
                    'name', c.name,
                    'country', c.country,
                    'photo_url', c.cover_image_url
                ) ORDER BY tc2.visit_order)
                FROM trip_cities tc2
                JOIN cities c ON tc2.city_id = c.id
                WHERE tc2.trip_id = t.id
                ) as cities
            FROM trips t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE t.id IN (
                SELECT DISTINCT t2.id
                FROM trips t2
                LEFT JOIN trip_companions tc ON t2.id = tc.trip_id
                WHERE t2.user_id = $1 
                   OR (tc.user_id = $1 AND tc.status = 'accepted')
            )
        `;

        const params: any[] = [userId];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND t.status = $${paramCount}`;
            params.push(status);
        }

        if (privacy) {
            paramCount++;
            query += ` AND t.privacy = $${paramCount}`;
            params.push(privacy);
        }

        query += ` ORDER BY t.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting user trips:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trips'
        });
    }
};

// Get single trip details
export const getTripById = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        const tripQuery = `
            SELECT 
                t.*,
                u.username as creator_username,
                u.full_name as creator_name,
                up.profile_photo_url as creator_photo
            FROM trips t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE t.id = $1
        `;

        const tripResult = await pool.query(tripQuery, [id]);

        if (tripResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        const trip = tripResult.rows[0];

        // Check privacy permissions
        if (trip.privacy === 'private' && trip.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this trip'
            });
        }

        if (trip.privacy === 'buddies_only') {
            const buddyCheck = await pool.query(
                `SELECT 1 FROM travel_buddy_connections 
                 WHERE ((user_id = $1 AND buddy_id = $2) OR (user_id = $2 AND buddy_id = $1))
                 AND status = 'accepted'`,
                [userId, trip.user_id]
            );

            const isCompanion = await pool.query(
                `SELECT 1 FROM trip_companions WHERE trip_id = $1 AND user_id = $2`,
                [id, userId]
            );

            if (trip.user_id !== userId && buddyCheck.rows.length === 0 && isCompanion.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to view this trip'
                });
            }
        }

        // Get cities
        const citiesQuery = `
            SELECT 
                tc.*,
                c.name,
                c.country,
                c.cover_image_url as photo_url,
                c.description
            FROM trip_cities tc
            JOIN cities c ON tc.city_id = c.id
            WHERE tc.trip_id = $1
            ORDER BY tc.visit_order
        `;
        const citiesResult = await pool.query(citiesQuery, [id]);

        // Get companions
        const companionsQuery = `
            SELECT 
                tc.*,
                u.username,
                u.full_name,
                up.profile_photo_url
            FROM trip_companions tc
            JOIN users u ON tc.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE tc.trip_id = $1
            ORDER BY tc.role, tc.invited_at
        `;
        const companionsResult = await pool.query(companionsQuery, [id]);

        // Get itinerary
        const itineraryQuery = `
            SELECT 
                ti.*,
                u.username as added_by_username
            FROM trip_itinerary ti
            LEFT JOIN users u ON ti.added_by = u.id
            WHERE ti.trip_id = $1
            ORDER BY ti.day_number, ti.time_slot
        `;
        const itineraryResult = await pool.query(itineraryQuery, [id]);

        // Get recommendations
        const recommendationsQuery = `
            SELECT 
                tr.*,
                r.title,
                r.description,
                r.user_rating,
                (SELECT rp.photo_url FROM recommendation_photos rp WHERE rp.recommendation_id = r.id ORDER BY rp.is_primary DESC, rp.created_at LIMIT 1) as photo_url,
                u.username as added_by_username
            FROM trip_recommendations tr
            JOIN recommendations r ON tr.recommendation_id = r.id
            LEFT JOIN users u ON tr.added_by = u.id
            WHERE tr.trip_id = $1
            ORDER BY tr.created_at DESC
        `;
        const recommendationsResult = await pool.query(recommendationsQuery, [id]);

        res.json({
            success: true,
            data: {
                ...trip,
                cities: citiesResult.rows,
                companions: companionsResult.rows,
                itinerary: itineraryResult.rows,
                recommendations: recommendationsResult.rows
            }
        });
    } catch (error) {
        console.error('Error getting trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trip details'
        });
    }
};

// Create new trip
export const createTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const {
            title,
            description,
            start_date,
            end_date,
            status = 'planning',
            privacy = 'buddies_only',
            cover_photo_url,
            is_collaborative = false,
            total_budget,
            currency = 'USD',
            cities = []
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Trip title is required'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Create trip
            const tripResult = await client.query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy, 
                                   cover_photo_url, is_collaborative, total_budget, currency)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [userId, title, description, start_date, end_date, status, privacy, 
                 cover_photo_url, is_collaborative, total_budget, currency]
            );

            const trip = tripResult.rows[0];

            // Add trip creator as organizer in companions
            await client.query(
                `INSERT INTO trip_companions (trip_id, user_id, role, status, responded_at)
                 VALUES ($1, $2, 'organizer', 'accepted', NOW())`,
                [trip.id, userId]
            );

            // Add cities if provided
            if (cities && cities.length > 0) {
                for (let i = 0; i < cities.length; i++) {
                    const city = cities[i];
                    await client.query(
                        `INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [trip.id, city.city_id, city.arrival_date, city.departure_date, i + 1, city.notes]
                    );
                }
            }

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Trip created successfully',
                data: trip
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create trip'
        });
    }
};

// Update trip
export const updateTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const updates = req.body;

        // Check if user owns the trip
        const ownerCheck = await pool.query(
            'SELECT user_id FROM trips WHERE id = $1',
            [id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (ownerCheck.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this trip'
            });
        }

        const allowedFields = [
            'title', 'description', 'start_date', 'end_date', 'status', 
            'privacy', 'cover_photo_url', 'is_collaborative', 'total_budget', 'currency'
        ];

        const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const values = updateFields.map(field => updates[field]);

        const result = await pool.query(
            `UPDATE trips 
             SET ${setClause}, updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [id, ...values]
        );

        res.json({
            success: true,
            message: 'Trip updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update trip'
        });
    }
};

// Delete trip
export const deleteTrip = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        // Check if user owns the trip
        const ownerCheck = await pool.query(
            'SELECT user_id FROM trips WHERE id = $1',
            [id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        if (ownerCheck.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this trip'
            });
        }

        await pool.query('DELETE FROM trips WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Trip deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting trip:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete trip'
        });
    }
};

// Invite companion to trip
export const inviteCompanion = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { user_id: companionId } = req.body;

        // Check if user owns the trip or is an organizer
        const tripCheck = await pool.query(
            `SELECT t.user_id, tc.role
             FROM trips t
             LEFT JOIN trip_companions tc ON t.id = tc.trip_id AND tc.user_id = $1
             WHERE t.id = $2`,
            [userId, id]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        const isOwner = tripCheck.rows[0].user_id === userId;
        const isOrganizer = tripCheck.rows[0].role === 'organizer';

        if (!isOwner && !isOrganizer) {
            return res.status(403).json({
                success: false,
                message: 'Only trip organizers can invite companions'
            });
        }

        // Check if companion is already invited
        const existingInvite = await pool.query(
            'SELECT * FROM trip_companions WHERE trip_id = $1 AND user_id = $2',
            [id, companionId]
        );

        if (existingInvite.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User is already invited to this trip'
            });
        }

        const result = await pool.query(
            `INSERT INTO trip_companions (trip_id, user_id, role, status)
             VALUES ($1, $2, 'participant', 'pending')
             RETURNING *`,
            [id, companionId]
        );

        res.status(201).json({
            success: true,
            message: 'Companion invited successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error inviting companion:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invite companion'
        });
    }
};

// Respond to trip invitation
export const respondToInvitation = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'declined'

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "accepted" or "declined"'
            });
        }

        const result = await pool.query(
            `UPDATE trip_companions
             SET status = $1, responded_at = NOW()
             WHERE trip_id = $2 AND user_id = $3 AND status = 'pending'
             RETURNING *`,
            [status, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found or already responded'
            });
        }

        res.json({
            success: true,
            message: `Invitation ${status} successfully`,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error responding to invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to respond to invitation'
        });
    }
};

// Remove companion from trip
export const removeCompanion = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, companionId } = req.params;

        // Check if user owns the trip
        const ownerCheck = await pool.query(
            'SELECT user_id FROM trips WHERE id = $1',
            [id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        const isOwner = ownerCheck.rows[0].user_id === userId;
        const isSelf = parseInt(companionId) === userId;

        if (!isOwner && !isSelf) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to remove this companion'
            });
        }

        await pool.query(
            'DELETE FROM trip_companions WHERE trip_id = $1 AND user_id = $2',
            [id, companionId]
        );

        res.json({
            success: true,
            message: 'Companion removed successfully'
        });
    } catch (error) {
        console.error('Error removing companion:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove companion'
        });
    }
};
