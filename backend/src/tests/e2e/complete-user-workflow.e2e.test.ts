/**
 * Complete User Workflow E2E Tests
 * Tests full user journey from signup to social interactions
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import { cleanupAllTestData } from '../helpers/test-helpers';

describe('Complete User Workflow E2E', () => {
    const app = createApp();
    let user1Email: string;
    let user2Email: string;
    let user1Token: string;
    let user2Token: string;
    let user1Id: number;
    let user2Id: number;
    let recommendationId: number;

    beforeAll(async () => {
        // Generate unique emails for this test run
        const timestamp = Date.now();
        user1Email = `e2e.user1.${timestamp}@test.com`;
        user2Email = `e2e.user2.${timestamp}@test.com`;
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('User Journey: Signup to Feed Interaction', () => {
        it('Step 1: User 1 signs up', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: user1Email,
                    username: `e2euser1_${Date.now()}`,
                    password: 'Test123!@#',
                    fullName: 'E2E Test User One',
                    bio: 'Testing the complete workflow',
                    city: 'Toronto',
                    country: 'Canada'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user).toBeDefined();

            user1Token = response.body.data.token;
            user1Id = response.body.data.user.id;
        });

        it('Step 2: User 2 signs up', async () => {
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: user2Email,
                    username: `e2euser2_${Date.now()}`,
                    password: 'Test123!@#',
                    fullName: 'E2E Test User Two',
                    bio: 'Another test user',
                    city: 'Vancouver',
                    country: 'Canada'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            user2Token = response.body.data.token;
            user2Id = response.body.data.user.id;
        });

        it('Step 3: User 1 updates profile', async () => {
            const response = await request(app)
                .patch('/api/profile')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    bio: 'Updated bio for E2E testing',
                    interests: ['Adventure Travel', 'Food Tourism']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.bio).toBe('Updated bio for E2E testing');
        });

        it('Step 4: User 1 creates a recommendation', async () => {
            const response = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    title: 'Amazing Coffee Shop in Toronto',
                    description: 'Best coffee in town!',
                    category_id: 1,
                    city_id: 1,
                    address: '123 Main St',
                    user_rating: 5,
                    cost_rating: 3,
                    latitude: 43.6532,
                    longitude: -79.3832
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBeDefined();
            recommendationId = response.body.data.id;
        });

        it('Step 5: User 1 searches for users to connect with', async () => {
            const response = await request(app)
                .get('/api/search/users?query=E2E')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            
            // Should find User 2
            const foundUser2 = response.body.data.find((u: any) => u.id === user2Id);
            expect(foundUser2).toBeDefined();
        });

        it('Step 6: User 1 sends buddy request to User 2', async () => {
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ requestedUserId: user2Id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('sent successfully');
        });

        it('Step 7: User 2 checks pending buddy requests', async () => {
            const response = await request(app)
                .get('/api/buddies/pending')
                .set('Authorization', `Bearer ${user2Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);

            // Should see request from User 1
            const requestFromUser1 = response.body.data.find(
                (req: any) => req.requester_id === user1Id
            );
            expect(requestFromUser1).toBeDefined();
        });

        it('Step 8: User 2 accepts buddy request', async () => {
            const response = await request(app)
                .post('/api/buddies/accept')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({ requesterId: user1Id })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('accepted');
        });

        it('Step 9: User 1 verifies buddy connection', async () => {
            const response = await request(app)
                .get('/api/buddies')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const user2Buddy = response.body.data.find((b: any) => b.id === user2Id);
            expect(user2Buddy).toBeDefined();
        });

        it('Step 10: User 2 views personalized feed (should include User 1\'s recommendation)', async () => {
            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${user2Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            
            // Should see User 1's recommendation in feed
            const user1Post = response.body.data.find(
                (post: any) => post.id === recommendationId
            );
            expect(user1Post).toBeDefined();
            if (user1Post) {
                expect(user1Post.source).toBe('buddy'); // Should be marked as buddy content
            }
        });

        it('Step 11: User 2 likes User 1\'s recommendation', async () => {
            const response = await request(app)
                .post(`/api/recommendations/${recommendationId}/like`)
                .set('Authorization', `Bearer ${user2Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.likes_count).toBeGreaterThan(0);
        });

        it('Step 12: User 2 bookmarks User 1\'s recommendation', async () => {
            const response = await request(app)
                .post(`/api/social/bookmarks/${recommendationId}`)
                .set('Authorization', `Bearer ${user2Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isBookmarked).toBe(true);
        });

        it('Step 13: User 2 shares User 1\'s recommendation', async () => {
            const response = await request(app)
                .post(`/api/social/shares/${recommendationId}`)
                .set('Authorization', `Bearer ${user2Token}`)
                .send({ platform: 'twitter' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('Step 14: User 2 views their bookmarks', async () => {
            const response = await request(app)
                .get('/api/social/bookmarks')
                .set('Authorization', `Bearer ${user2Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);

            const bookmarkedPost = response.body.data.find(
                (b: any) => b.recommendation_id === recommendationId
            );
            expect(bookmarkedPost).toBeDefined();
        });

        it('Step 15: User 1 checks their stats (should see likes and shares)', async () => {
            const response = await request(app)
                .get('/api/social/stats')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total_likes_received).toBeGreaterThan(0);
            expect(response.body.data.total_shares_received).toBeGreaterThan(0);
        });

        it('Step 16: User 2 searches for recommendations near Toronto', async () => {
            const response = await request(app)
                .get('/api/search?query=coffee&latitude=43.6532&longitude=-79.3832&radius=10')
                .set('Authorization', `Bearer ${user2Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            
            // Should find User 1's recommendation
            const found = response.body.data.find(
                (r: any) => r.id === recommendationId
            );
            expect(found).toBeDefined();
        });

        it('Step 17: User 1 updates their recommendation', async () => {
            const response = await request(app)
                .put(`/api/recommendations/${recommendationId}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    title: 'Updated: Amazing Coffee Shop in Toronto',
                    description: 'Best coffee in town! Now with new pastries!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toContain('Updated:');
        });

        it('Step 18: User 2 comments on the recommendation', async () => {
            const response = await request(app)
                .post(`/api/recommendations/${recommendationId}/comments`)
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    comment: 'Great recommendation! I visited and loved it!'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.comment).toBeDefined();
        });

        it('Step 19: User 1 views active buddies', async () => {
            // Update User 2's last_active
            await query('UPDATE users SET last_active = NOW() WHERE id = $1', [user2Id]);

            const response = await request(app)
                .get('/api/feed/active-buddies')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const activeUser2 = response.body.data.find((b: any) => b.id === user2Id);
            expect(activeUser2).toBeDefined();
        });

        it('Step 20: User 1 views trending recommendations', async () => {
            const response = await request(app)
                .get('/api/feed/trending?days=7')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('User Journey: Password Reset Flow', () => {
        let securityCode: string;

        it('Step 1: User requests password reset', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: user1Email })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('security code');

            // Get security code from database (in production, this would be sent via email)
            const result = await query(
                'SELECT security_code FROM users WHERE email = $1',
                [user1Email]
            );
            securityCode = result.rows[0].security_code;
        });

        it('Step 2: User resets password with security code', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: user1Email,
                    securityCode,
                    newPassword: 'NewPassword123!@#'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('successfully');
        });

        it('Step 3: User logs in with new password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user1Email,
                    password: 'NewPassword123!@#'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();

            // Update token for further tests
            user1Token = response.body.data.token;
        });

        it('Step 4: Old password should not work', async () => {
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: user1Email,
                    password: 'Test123!@#'
                })
                .expect(401);
        });
    });

    describe('User Journey: Buddy Management', () => {
        let user3Id: number;
        let user3Token: string;

        it('Step 1: Create third user', async () => {
            const timestamp = Date.now();
            const response = await request(app)
                .post('/api/auth/signup')
                .send({
                    email: `e2e.user3.${timestamp}@test.com`,
                    username: `e2euser3_${timestamp}`,
                    password: 'Test123!@#',
                    fullName: 'E2E Test User Three'
                })
                .expect(201);

            user3Id = response.body.data.user.id;
            user3Token = response.body.data.token;
        });

        it('Step 2: User 1 sends buddy request to User 3', async () => {
            await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ requestedUserId: user3Id })
                .expect(201);
        });

        it('Step 3: User 1 cancels buddy request', async () => {
            const response = await request(app)
                .delete('/api/buddies/cancel')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ requestedUserId: user3Id })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('Step 4: User 3 sends buddy request to User 1', async () => {
            await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${user3Token}`)
                .send({ requestedUserId: user1Id })
                .expect(201);
        });

        it('Step 5: User 1 declines buddy request', async () => {
            const response = await request(app)
                .post('/api/buddies/decline')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ requesterId: user3Id })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('Step 6: User 1 blocks User 3', async () => {
            const response = await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ blockedUserId: user3Id })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('Step 7: User 3 cannot send buddy request to User 1 (blocked)', async () => {
            await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${user3Token}`)
                .send({ requestedUserId: user1Id })
                .expect(400);
        });

        it('Step 8: User 1 unblocks User 3', async () => {
            const response = await request(app)
                .delete('/api/buddies/unblock')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ blockedUserId: user3Id })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('Step 9: User 1 removes User 2 as buddy', async () => {
            const response = await request(app)
                .delete('/api/buddies/remove')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ buddyUserId: user2Id })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('User Journey: Content Moderation', () => {
        let reportedRecId: number;

        it('Step 1: User 2 creates inappropriate content', async () => {
            const response = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${user2Token}`)
                .send({
                    title: 'Test Content for Reporting',
                    description: 'This will be reported',
                    category_id: 1,
                    city_id: 1,
                    user_rating: 3
                })
                .expect(201);

            reportedRecId = response.body.data.id;
        });

        it('Step 2: User 1 reports the content', async () => {
            const response = await request(app)
                .post(`/api/social/reports/${reportedRecId}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    reason: 'inappropriate',
                    description: 'This content violates community guidelines'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('reported');
        });

        it('Step 3: User 1 cannot report the same content twice', async () => {
            await request(app)
                .post(`/api/social/reports/${reportedRecId}`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    reason: 'spam',
                    description: 'Duplicate report'
                })
                .expect(400);
        });
    });
});
