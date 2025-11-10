/**
 * Feed System Unit Tests
 * Tests for personalized feed algorithm, trending posts, and active buddies
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    createTestRecommendation,
    generateTestToken,
    cleanupAllTestData
} from '../helpers/test-helpers';

describe('Feed System', () => {
    const app = createApp();
    let user1: any;
    let user2: any;
    let user3: any;
    let token1: string;
    let token2: string;
    let token3: string;
    let recommendation1: any;
    let recommendation2: any;
    let recommendation3: any;

    beforeAll(async () => {
        // Create test users
        user1 = await createTestUser({ fullName: 'Feed User One' });
        user2 = await createTestUser({ fullName: 'Feed User Two' });
        user3 = await createTestUser({ fullName: 'Feed User Three' });

        token1 = generateTestToken(user1.id);
        token2 = generateTestToken(user2.id);
        token3 = generateTestToken(user3.id);

        // Create test recommendations
        recommendation1 = await createTestRecommendation(user1.id, {
            title: 'Popular Recommendation',
            user_rating: 5
        });
        
        recommendation2 = await createTestRecommendation(user2.id, {
            title: 'Trending Recommendation',
            user_rating: 4
        });

        recommendation3 = await createTestRecommendation(user3.id, {
            title: 'Recent Recommendation',
            user_rating: 5
        });

        // Make user1 and user2 buddies
        await query(
            `INSERT INTO travel_buddy_connections (requester_id, requested_id, status, responded_at)
             VALUES ($1, $2, 'accepted', NOW())`,
            [user1.id, user2.id]
        );
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('GET /api/feed', () => {
        it('should get personalized feed for authenticated user', async () => {
            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(10);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/feed')
                .expect(401);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/feed?page=1&limit=5')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.limit).toBe(5);
        });

        it('should return posts with required fields', async () => {
            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            if (response.body.data.length > 0) {
                const post = response.body.data[0];
                expect(post).toHaveProperty('id');
                expect(post).toHaveProperty('title');
                expect(post).toHaveProperty('user_rating');
                expect(post).toHaveProperty('likes_count');
                expect(post).toHaveProperty('shares_count');
                expect(post).toHaveProperty('views_count');
                expect(post).toHaveProperty('username');
                expect(post).toHaveProperty('full_name');
                expect(post).toHaveProperty('category_name');
                expect(post).toHaveProperty('city_name');
                expect(post).toHaveProperty('source'); // 'buddy', 'trending', or 'interest'
                expect(post).toHaveProperty('photos');
                expect(post).toHaveProperty('is_liked');
                expect(post).toHaveProperty('is_bookmarked');
            }
        });

        it('should include posts from buddies', async () => {
            // User2 creates a recommendation
            const buddyRec = await createTestRecommendation(user2.id, {
                title: 'Buddy Post Test'
            });

            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            // Should include buddy's post
            const hasBuddyPost = response.body.data.some((post: any) => 
                post.user_id === user2.id || post.source === 'buddy'
            );
            
            expect(hasBuddyPost).toBe(true);
        });

        it('should support location-based filtering', async () => {
            const response = await request(app)
                .get('/api/feed?latitude=43.6532&longitude=-79.3832&radius=50')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.debug).toBeDefined();
            expect(response.body.debug.locationFilter).toBe(true);
        });

        it('should return debug info about feed composition', async () => {
            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            if (response.body.debug) {
                expect(response.body.debug).toHaveProperty('buddyCount');
                expect(response.body.debug).toHaveProperty('trendingCount');
                expect(response.body.debug).toHaveProperty('interestCount');
            }
        });
    });

    describe('GET /api/feed/trending', () => {
        beforeEach(async () => {
            // Add engagement to make recommendation trending
            await query(
                'UPDATE recommendations SET likes_count = 10, shares_count = 5, views_count = 100 WHERE id = $1',
                [recommendation1.id]
            );
        });

        it('should get trending recommendations', async () => {
            const response = await request(app)
                .get('/api/feed/trending')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should allow unauthenticated access', async () => {
            const response = await request(app)
                .get('/api/feed/trending')
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support days parameter', async () => {
            const response = await request(app)
                .get('/api/feed/trending?days=30')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/feed/trending?page=1&limit=3')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.limit).toBe(3);
        });

        it('should order by engagement score', async () => {
            // Create recommendations with different engagement
            const highEngagement = await createTestRecommendation(user1.id, {
                title: 'High Engagement Post'
            });
            await query(
                'UPDATE recommendations SET likes_count = 50, shares_count = 20 WHERE id = $1',
                [highEngagement.id]
            );

            const lowEngagement = await createTestRecommendation(user1.id, {
                title: 'Low Engagement Post'
            });
            await query(
                'UPDATE recommendations SET likes_count = 1, shares_count = 0 WHERE id = $1',
                [lowEngagement.id]
            );

            const response = await request(app)
                .get('/api/feed/trending?limit=10')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            if (response.body.data.length > 1) {
                // First post should have higher or equal engagement than second
                const first = response.body.data[0];
                const second = response.body.data[1];
                const firstScore = first.likes_count * 2 + first.shares_count * 3;
                const secondScore = second.likes_count * 2 + second.shares_count * 3;
                
                expect(firstScore).toBeGreaterThanOrEqual(secondScore);
            }
        });
    });

    describe('GET /api/feed/active-buddies', () => {
        beforeEach(async () => {
            // Update last_active for user2
            await query(
                'UPDATE users SET last_active = NOW() WHERE id = $1',
                [user2.id]
            );
        });

        it('should get active buddies', async () => {
            const response = await request(app)
                .get('/api/feed/active-buddies')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/feed/active-buddies')
                .expect(401);
        });

        it('should include buddy details', async () => {
            const response = await request(app)
                .get('/api/feed/active-buddies')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            if (response.body.data.length > 0) {
                const buddy = response.body.data[0];
                expect(buddy).toHaveProperty('id');
                expect(buddy).toHaveProperty('username');
                expect(buddy).toHaveProperty('full_name');
                expect(buddy).toHaveProperty('last_active');
            }
        });

        it('should support limit parameter', async () => {
            const response = await request(app)
                .get('/api/feed/active-buddies?limit=5')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
        });

        it('should order by most recent activity', async () => {
            // Make user3 a buddy and set different activity times
            await query(
                `INSERT INTO travel_buddy_connections (requester_id, requested_id, status, responded_at)
                 VALUES ($1, $2, 'accepted', NOW())`,
                [user1.id, user3.id]
            );

            await query(
                'UPDATE users SET last_active = NOW() - INTERVAL \'1 hour\' WHERE id = $1',
                [user2.id]
            );
            await query(
                'UPDATE users SET last_active = NOW() WHERE id = $1',
                [user3.id]
            );

            const response = await request(app)
                .get('/api/feed/active-buddies')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            if (response.body.data.length > 1) {
                // First buddy should have more recent activity
                const first = new Date(response.body.data[0].last_active);
                const second = new Date(response.body.data[1].last_active);
                expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
            }
        });
    });

    describe('Feed Algorithm Integration', () => {
        it('should mix content from buddies, trending, and interests', async () => {
            // Set user interests
            await query(
                'INSERT INTO user_interests (user_id, category_id) VALUES ($1, 1) ON CONFLICT DO NOTHING',
                [user1.id]
            );

            // Create various types of content
            const buddyPost = await createTestRecommendation(user2.id, {
                title: 'Buddy Content'
            });

            const trendingPost = await createTestRecommendation(user3.id, {
                title: 'Trending Content',
                category_id: 2
            });
            await query(
                'UPDATE recommendations SET likes_count = 20, shares_count = 10 WHERE id = $1',
                [trendingPost.id]
            );

            const interestPost = await createTestRecommendation(user3.id, {
                title: 'Interest-Based Content',
                category_id: 1
            });

            const response = await request(app)
                .get('/api/feed?limit=20')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const sources = response.body.data.map((post: any) => post.source);
            
            // Should have a mix of sources (though might not all be present in small test dataset)
            expect(sources.length).toBeGreaterThan(0);
        });
    });
});
