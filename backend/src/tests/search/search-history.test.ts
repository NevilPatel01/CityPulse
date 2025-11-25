/**
 * Search History and Saved Searches Tests
 * Tests for search history tracking and saved searches functionality
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    generateTestToken,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';

describe('Search History and Saved Searches', () => {
    const app = createApp();
    let user: any;
    let token: string;

    beforeAll(async () => {
        user = await createTestUser({ 
            fullName: 'Search Test User',
            username: 'search_test_user'
        });
        token = generateTestToken(user.id);
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('Search History', () => {
        it('should save search to history', async () => {
            const response = await request(app)
                .post('/api/search/history')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchQuery: 'test search query',
                    filtersApplied: { category: 'restaurant' },
                    resultsCount: 10
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.search_query).toBe('test search query');
            expect(response.body.data.user_id).toBe(user.id);

            // Verify in database
            const dbResult = await query(
                `SELECT * FROM search_history WHERE id = $1`,
                [response.body.data.id]
            );
            expect(dbResult.rows.length).toBe(1);
        });

        it('should require search query', async () => {
            const response = await request(app)
                .post('/api/search/history')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    filtersApplied: { category: 'restaurant' }
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should get user search history with pagination', async () => {
            // Create some search history entries
            for (let i = 0; i < 5; i++) {
                await query(
                    `INSERT INTO search_history (user_id, search_query, filters_applied, results_count)
                        VALUES ($1, $2, $3, $4)`,
                    [
                        user.id,
                        `search query ${i}`,
                        JSON.stringify({ category: 'restaurant' }),
                        i * 5
                    ]
                );
            }

            const response = await request(app)
                .get('/api/search/history')
                .set('Authorization', `Bearer ${token}`)
                .query({ limit: 3, offset: 0 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.history.length).toBeLessThanOrEqual(3);
            expect(response.body.data.pagination).toHaveProperty('total');
            expect(response.body.data.pagination).toHaveProperty('hasMore');
        });

        it('should delete search history entry', async () => {
            // Create a search history entry
            const insertResult = await query(
                `INSERT INTO search_history (user_id, search_query)
                 VALUES ($1, $2)
                 RETURNING *`,
                [user.id, 'test delete query']
            );
            const historyId = insertResult.rows[0].id;

            const response = await request(app)
                .delete(`/api/search/history/${historyId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify deleted
            const dbResult = await query(
                `SELECT * FROM search_history WHERE id = $1`,
                [historyId]
            );
            expect(dbResult.rows.length).toBe(0);
        });

        it('should prevent deleting other users search history', async () => {
            // Create another user
            const otherUser = await createTestUser({ 
                fullName: 'Other User',
                username: 'other_user'
            });

            // Create search history for other user
            const insertResult = await query(
                `INSERT INTO search_history (user_id, search_query)
                 VALUES ($1, $2)
                 RETURNING *`,
                [otherUser.id, 'other user query']
            );
            const historyId = insertResult.rows[0].id;

            // Try to delete as first user
            const response = await request(app)
                .delete(`/api/search/history/${historyId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should clear all search history for user', async () => {
            // Create some search history
            for (let i = 0; i < 3; i++) {
                await query(
                    `INSERT INTO search_history (user_id, search_query)
                     VALUES ($1, $2)`,
                    [user.id, `clear test ${i}`]
                );
            }

            const response = await request(app)
                .delete('/api/search/history')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify all deleted
            const dbResult = await query(
                `SELECT COUNT(*) as count FROM search_history WHERE user_id = $1`,
                [user.id]
            );
            expect(parseInt(dbResult.rows[0].count)).toBe(0);
        });
    });

    describe('Saved Searches', () => {
        it('should save a search', async () => {
            const response = await request(app)
                .post('/api/search/saved')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchName: 'My Favorite Restaurants',
                    searchQuery: 'restaurant',
                    filtersApplied: { 
                        category: 'restaurant',
                        priceMax: 50
                    }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.searchName).toBe('My Favorite Restaurants');
            expect(response.body.data.searchQuery).toBe('restaurant');
            expect(response.body.data.isActive).toBe(true);
        });

        it('should require search name and query', async () => {
            const response = await request(app)
                .post('/api/search/saved')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchName: 'Test'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should prevent duplicate search names for same user', async () => {
            // Create first saved search
            await request(app)
                .post('/api/search/saved')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchName: 'Duplicate Test',
                    searchQuery: 'test query'
                })
                .expect(200);

            // Try to create duplicate
            const response = await request(app)
                .post('/api/search/saved')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchName: 'Duplicate Test',
                    searchQuery: 'different query'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should get user saved searches', async () => {
            // Create some saved searches
            for (let i = 0; i < 3; i++) {
                await query(
                    `INSERT INTO saved_searches (user_id, search_name, search_query, is_active)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        user.id,
                        `Saved Search ${i}`,
                        `query ${i}`,
                        i < 2 // First two active, last inactive
                    ]
                );
            }

            const response = await request(app)
                .get('/api/search/saved')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(3);
        });

        it('should filter saved searches by active status', async () => {
            const response = await request(app)
                .get('/api/search/saved')
                .set('Authorization', `Bearer ${token}`)
                .query({ activeOnly: 'true' })
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach((search: any) => {
                expect(search.isActive).toBe(true);
            });
        });

        it('should update saved search', async () => {
            // Create saved search
            const insertResult = await query(
                `INSERT INTO saved_searches (user_id, search_name, search_query)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [user.id, 'Update Test', 'original query']
            );
            const searchId = insertResult.rows[0].id;

            const response = await request(app)
                .put(`/api/search/saved/${searchId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchQuery: 'updated query',
                    isActive: false
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.searchQuery).toBe('updated query');
            expect(response.body.data.isActive).toBe(false);
        });

        it('should prevent updating other users saved searches', async () => {
            // Create another user
            const otherUser = await createTestUser({ 
                fullName: 'Other User 2',
                username: 'other_user_2'
            });

            // Create saved search for other user
            const insertResult = await query(
                `INSERT INTO saved_searches (user_id, search_name, search_query)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [otherUser.id, 'Other User Search', 'query']
            );
            const searchId = insertResult.rows[0].id;

            // Try to update as first user
            const response = await request(app)
                .put(`/api/search/saved/${searchId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchQuery: 'hacked query'
                })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should delete saved search', async () => {
            // Create saved search
            const insertResult = await query(
                `INSERT INTO saved_searches (user_id, search_name, search_query)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [user.id, 'Delete Test', 'delete query']
            );
            const searchId = insertResult.rows[0].id;

            const response = await request(app)
                .delete(`/api/search/saved/${searchId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify deleted
            const dbResult = await query(
                `SELECT * FROM saved_searches WHERE id = $1`,
                [searchId]
            );
            expect(dbResult.rows.length).toBe(0);
        });

        it('should handle filters applied as JSON', async () => {
            const filters = {
                category: 'restaurant',
                priceMin: 10,
                priceMax: 50,
                tags: ['budget-friendly', 'family-friendly']
            };

            const response = await request(app)
                .post('/api/search/saved')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    searchName: 'Complex Filters Test',
                    searchQuery: 'restaurant',
                    filtersApplied: filters
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.filtersApplied).toEqual(filters);
        });
    });

    describe('Authentication Requirements', () => {
        it('should require authentication for search history endpoints', async () => {
            await request(app)
                .get('/api/search/history')
                .expect(401);

            await request(app)
                .post('/api/search/history')
                .send({ searchQuery: 'test' })
                .expect(401);
        });

        it('should require authentication for saved searches endpoints', async () => {
            await request(app)
                .get('/api/search/saved')
                .expect(401);

            await request(app)
                .post('/api/search/saved')
                .send({ searchName: 'test', searchQuery: 'test' })
                .expect(401);
        });
    });
});

