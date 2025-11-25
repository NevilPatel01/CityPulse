import { Request, Response } from 'express';
import { query } from '../lib/database';

/**
 * Save search to history
 * This should be called automatically when a user performs a search
 */
export const saveSearchHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { searchQuery, filtersApplied, resultsCount, clickedResultId } = req.body;

        if (!searchQuery || typeof searchQuery !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Save search history
        const result = await query(
            `INSERT INTO search_history (user_id, search_query, filters_applied, results_count, clicked_result_id)
                VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                userId,
                searchQuery,
                filtersApplied ? JSON.stringify(filtersApplied) : null,
                resultsCount || null,
                clickedResultId || null
            ]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Save search history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save search history'
        });
    }
};

/**
 * Get user's search history
 * GET /api/search-history
 */
export const getSearchHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { limit = 20, offset = 0 } = req.query;
        const limitNum = Math.min(parseInt(limit as string) || 20, 100);
        const offsetNum = parseInt(offset as string) || 0;

        const result = await query(
            `SELECT 
                id,
                search_query,
                filters_applied,
                results_count,
                clicked_result_id,
                search_date,
                created_at
                FROM search_history
                WHERE user_id = $1
                ORDER BY search_date DESC
                LIMIT $2 OFFSET $3`,
            [userId, limitNum, offsetNum]
        );

        const countResult = await query(
            `SELECT COUNT(*) as total FROM search_history WHERE user_id = $1`,
            [userId]
        );

        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                history: result.rows.map(row => ({
                    id: row.id,
                    searchQuery: row.search_query,
                    filtersApplied: row.filters_applied ? JSON.parse(row.filters_applied) : null,
                    resultsCount: row.results_count,
                    clickedResultId: row.clicked_result_id,
                    searchDate: row.search_date,
                    createdAt: row.created_at
                })),
                pagination: {
                    limit: limitNum,
                    offset: offsetNum,
                    total,
                    hasMore: offsetNum + limitNum < total
                }
            }
        });
    } catch (error) {
        console.error('Get search history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch search history'
        });
    }
};

/**
 * Delete search history entry
 * DELETE /api/search-history/:id
 */
export const deleteSearchHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Verify ownership
        const checkResult = await query(
            `SELECT id FROM search_history WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Search history entry not found'
            });
        }

        await query(
            `DELETE FROM search_history WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({
            success: true,
            message: 'Search history entry deleted'
        });
    } catch (error) {
        console.error('Delete search history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete search history entry'
        });
    }
};

/**
 * Clear all search history for user
 * DELETE /api/search-history
 */
export const clearSearchHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await query(
            `DELETE FROM search_history WHERE user_id = $1`,
            [userId]
        );

        res.json({
            success: true,
            message: 'Search history cleared'
        });
    } catch (error) {
        console.error('Clear search history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear search history'
        });
    }
};

/**
 * Save a search for later
 * POST /api/saved-searches
 */
export const saveSearch = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { searchName, searchQuery, filtersApplied } = req.body;

        if (!searchName || !searchQuery) {
            return res.status(400).json({
                success: false,
                message: 'Search name and query are required'
            });
        }

        // Check if name already exists for this user
        const existing = await query(
            `SELECT id FROM saved_searches WHERE user_id = $1 AND search_name = $2`,
            [userId, searchName]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A saved search with this name already exists'
            });
        }

        const result = await query(
            `INSERT INTO saved_searches (user_id, search_name, search_query, filters_applied)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                userId,
                searchName,
                searchQuery,
                filtersApplied ? JSON.stringify(filtersApplied) : null
            ]
        );

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                searchName: result.rows[0].search_name,
                searchQuery: result.rows[0].search_query,
                filtersApplied: result.rows[0].filters_applied ? JSON.parse(result.rows[0].filters_applied) : null,
                isActive: result.rows[0].is_active,
                createdAt: result.rows[0].created_at,
                updatedAt: result.rows[0].updated_at
            }
        });
    } catch (error) {
        console.error('Save search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save search'
        });
    }
};

/**
 * Get user's saved searches
 * GET /api/saved-searches
 */
export const getSavedSearches = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { activeOnly = 'false' } = req.query;
        const activeOnlyBool = activeOnly === 'true';

        let queryStr = `
            SELECT 
                id,
                search_name,
                search_query,
                filters_applied,
                is_active,
                created_at,
                updated_at
            FROM saved_searches
            WHERE user_id = $1
        `;

        const params: any[] = [userId];

        if (activeOnlyBool) {
            queryStr += ` AND is_active = true`;
        }

        queryStr += ` ORDER BY created_at DESC`;

        const result = await query(queryStr, params);

        res.json({
            success: true,
            data: result.rows.map(row => ({
                id: row.id,
                searchName: row.search_name,
                searchQuery: row.search_query,
                filtersApplied: row.filters_applied ? JSON.parse(row.filters_applied) : null,
                isActive: row.is_active,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }))
        });
    } catch (error) {
        console.error('Get saved searches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch saved searches'
        });
    }
};

/**
 * Update saved search
 * PUT /api/saved-searches/:id
 */
export const updateSavedSearch = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { searchName, searchQuery, filtersApplied, isActive } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Verify ownership
        const checkResult = await query(
            `SELECT id FROM saved_searches WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Saved search not found'
            });
        }

        // Build update query dynamically
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (searchName !== undefined) {
            updates.push(`search_name = $${paramIndex}`);
            params.push(searchName);
            paramIndex++;
        }

        if (searchQuery !== undefined) {
            updates.push(`search_query = $${paramIndex}`);
            params.push(searchQuery);
            paramIndex++;
        }

        if (filtersApplied !== undefined) {
            updates.push(`filters_applied = $${paramIndex}`);
            params.push(JSON.stringify(filtersApplied));
            paramIndex++;
        }

        if (isActive !== undefined) {
            updates.push(`is_active = $${paramIndex}`);
            params.push(isActive);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updates.push(`updated_at = NOW()`);
        params.push(id, userId);

        const result = await query(
            `UPDATE saved_searches 
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
             RETURNING *`,
            params
        );

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                searchName: result.rows[0].search_name,
                searchQuery: result.rows[0].search_query,
                filtersApplied: result.rows[0].filters_applied ? JSON.parse(result.rows[0].filters_applied) : null,
                isActive: result.rows[0].is_active,
                createdAt: result.rows[0].created_at,
                updatedAt: result.rows[0].updated_at
            }
        });
    } catch (error) {
        console.error('Update saved search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update saved search'
        });
    }
};

/**
 * Delete saved search
 * DELETE /api/saved-searches/:id
 */
export const deleteSavedSearch = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Verify ownership
        const checkResult = await query(
            `SELECT id FROM saved_searches WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Saved search not found'
            });
        }

        await query(
            `DELETE FROM saved_searches WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({
            success: true,
            message: 'Saved search deleted'
        });
    } catch (error) {
        console.error('Delete saved search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete saved search'
        });
    }
};

