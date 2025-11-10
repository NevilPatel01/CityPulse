/**
 * Social Features Unit Tests
 * Tests for bookmarks, shares, reports, and user stats
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    createTestRecommendation,
    generateTestToken,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';

describe('Social Features', () => {
    const app = createApp();
    let user1: any;
    let user2: any;
    let token1: string;
    let token2: string;
    let recommendation1: any;
    let recommendation2: any;

    beforeAll(async () => {
        // Create test users
        user1 = await createTestUser({ fullName: 'Social User One' });
        user2 = await createTestUser({ fullName: 'Social User Two' });

        token1 = generateTestToken(user1.id);
        token2 = generateTestToken(user2.id);

        // Create test recommendations
        recommendation1 = await createTestRecommendation(user1.id, {
            title: 'Test Recommendation for Social Features'
        });
        recommendation2 = await createTestRecommendation(user2.id, {
            title: 'Another Test Recommendation'
        });
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('POST /api/social/bookmarks/:recommendationId', () => {
        it('should bookmark a recommendation', async () => {
            const response = await request(app)
                .post(`/api/social/bookmarks/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isBookmarked).toBe(true);
        });

        it('should unbookmark a previously bookmarked recommendation', async () => {
            // First bookmark
            await request(app)
                .post(`/api/social/bookmarks/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            // Then unbookmark
            const response = await request(app)
                .post(`/api/social/bookmarks/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isBookmarked).toBe(false);
        });

        it('should require authentication', async () => {
            await request(app)
                .post(`/api/social/bookmarks/${recommendation1.id}`)
                .expect(401);
        });

        it('should return 404 for non-existent recommendation', async () => {
            await request(app)
                .post('/api/social/bookmarks/999999')
                .set('Authorization', `Bearer ${token2}`)
                .expect(404);
        });
    });

    describe('GET /api/social/bookmarks/:recommendationId/status', () => {
        beforeEach(async () => {
            // Clean up bookmarks
            await query(
                'DELETE FROM recommendation_bookmarks WHERE user_id = $1',
                [user2.id]
            );
        });

        it('should check bookmark status (not bookmarked)', async () => {
            const response = await request(app)
                .get(`/api/social/bookmarks/${recommendation1.id}/status`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isBookmarked).toBe(false);
        });

        it('should check bookmark status (bookmarked)', async () => {
            // Bookmark first
            await request(app)
                .post(`/api/social/bookmarks/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            const response = await request(app)
                .get(`/api/social/bookmarks/${recommendation1.id}/status`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isBookmarked).toBe(true);
        });
    });

    describe('GET /api/social/bookmarks', () => {
        beforeEach(async () => {
            // Clean up and create fresh bookmarks
            await query(
                'DELETE FROM recommendation_bookmarks WHERE user_id = $1',
                [user2.id]
            );

            await query(
                'INSERT INTO recommendation_bookmarks (user_id, recommendation_id) VALUES ($1, $2)',
                [user2.id, recommendation1.id]
            );
        });

        it('should get all bookmarked recommendations', async () => {
            const response = await request(app)
                .get('/api/social/bookmarks')
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0]).toHaveProperty('title');
            expect(response.body.data[0]).toHaveProperty('bookmarked_at');
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/social/bookmarks?page=1&limit=5')
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });
    });

    describe('POST /api/social/shares/:recommendationId', () => {
        it('should record a share', async () => {
            const response = await request(app)
                .post(`/api/social/shares/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({ platform: 'twitter' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should increment shares count', async () => {
            // Get initial count
            const initialResult = await query(
                'SELECT shares_count FROM recommendations WHERE id = $1',
                [recommendation1.id]
            );
            const initialCount = initialResult.rows[0].shares_count;

            // Record share
            await request(app)
                .post(`/api/social/shares/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({ platform: 'facebook' })
                .expect(200);

            // Get updated count
            const updatedResult = await query(
                'SELECT shares_count FROM recommendations WHERE id = $1',
                [recommendation1.id]
            );
            const updatedCount = updatedResult.rows[0].shares_count;

            expect(updatedCount).toBe(initialCount + 1);
        });

        it('should accept different share platforms', async () => {
            const platforms = ['twitter', 'facebook', 'whatsapp', 'copy_link'];

            for (const platform of platforms) {
                const response = await request(app)
                    .post(`/api/social/shares/${recommendation1.id}`)
                    .set('Authorization', `Bearer ${token2}`)
                    .send({ platform })
                    .expect(200);

                expect(response.body.success).toBe(true);
            }
        });
    });

    describe('POST /api/social/reports/:recommendationId', () => {
        it('should report a recommendation', async () => {
            const response = await request(app)
                .post(`/api/social/reports/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({
                    reason: 'spam',
                    description: 'This looks like spam content'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should validate report reason', async () => {
            const response = await request(app)
                .post(`/api/social/reports/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({
                    reason: 'invalid_reason'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should accept all valid report reasons', async () => {
            const reasons = ['spam', 'inappropriate', 'misleading', 'offensive', 'copyright', 'other'];

            for (const reason of reasons) {
                const response = await request(app)
                    .post(`/api/social/reports/${recommendation1.id}`)
                    .set('Authorization', `Bearer ${token2}`)
                    .send({ reason })
                    .expect(200);

                expect(response.body.success).toBe(true);
            }
        });

        it('should prevent duplicate reports from same user', async () => {
            // First report
            await request(app)
                .post(`/api/social/reports/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({ reason: 'spam' })
                .expect(200);

            // Duplicate report
            const response = await request(app)
                .post(`/api/social/reports/${recommendation1.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({ reason: 'spam' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already reported');
        });
    });

    describe('GET /api/social/stats', () => {
        beforeEach(async () => {
            // Create some activity for stats
            await query(
                'INSERT INTO recommendation_likes (user_id, recommendation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [user2.id, recommendation1.id]
            );

            await query(
                'UPDATE recommendations SET views_count = views_count + 5 WHERE user_id = $1',
                [user1.id]
            );
        });

        it('should get user statistics', async () => {
            const response = await request(app)
                .get('/api/social/stats')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('recommendations');
            expect(response.body.data).toHaveProperty('citiesVisited');
            expect(response.body.data).toHaveProperty('buddies');
            expect(response.body.data).toHaveProperty('likesReceived');
            expect(response.body.data).toHaveProperty('totalViews');
        });

        it('should return correct counts', async () => {
            const response = await request(app)
                .get('/api/social/stats')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(typeof response.body.data.recommendations).toBe('number');
            expect(typeof response.body.data.likesReceived).toBe('number');
            expect(response.body.data.recommendations).toBeGreaterThanOrEqual(0);
        });
    });

    describe('POST /api/social/interests', () => {
        it('should set user interests', async () => {
            const response = await request(app)
                .post('/api/social/interests')
                .set('Authorization', `Bearer ${token1}`)
                .send({ categoryIds: [1, 2, 3] })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should validate category IDs array', async () => {
            const response = await request(app)
                .post('/api/social/interests')
                .set('Authorization', `Bearer ${token1}`)
                .send({ categoryIds: 'invalid' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should replace existing interests', async () => {
            // Set initial interests
            await request(app)
                .post('/api/social/interests')
                .set('Authorization', `Bearer ${token1}`)
                .send({ categoryIds: [1, 2] })
                .expect(200);

            // Update interests
            await request(app)
                .post('/api/social/interests')
                .set('Authorization', `Bearer ${token1}`)
                .send({ categoryIds: [3, 4, 5] })
                .expect(200);

            // Verify only new interests exist
            const result = await query(
                'SELECT category_id FROM user_interests WHERE user_id = $1',
                [user1.id]
            );

            expect(result.rows.length).toBe(3);
            expect(result.rows.some((r: any) => r.category_id === 1)).toBe(false);
            expect(result.rows.some((r: any) => r.category_id === 3)).toBe(true);
        });
    });

    describe('GET /api/social/interests', () => {
        beforeEach(async () => {
            // Set up interests
            await query(
                'DELETE FROM user_interests WHERE user_id = $1',
                [user1.id]
            );

            await query(
                'INSERT INTO user_interests (user_id, category_id) VALUES ($1, $2), ($1, $3)',
                [user1.id, 1, 2]
            );
        });

        it('should get user interests', async () => {
            const response = await request(app)
                .get('/api/social/interests')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});
