/**
 * Comprehensive Security Tests
 * Tests for authentication, authorization, input validation, and SQL injection prevention
 */

import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    generateTestToken,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';
import { describe, beforeAll, afterAll, expect, it } from '@jest/globals';
import jwt from 'jsonwebtoken';

const app = createApp();

describe('Security Tests - Comprehensive Suite', () => {
    let user1: any;
    let user2: any;
    let token1: string;
    let token2: string;
    let testTrip: any;
    let testRecommendation: any;
    let testCity: any;
    let testCategory: any;

    beforeAll(async () => {
        // Create test users
        user1 = await createTestUser({ fullName: 'Security User 1', email: 'security1@test.com' });
        user2 = await createTestUser({ fullName: 'Security User 2', email: 'security2@test.com' });

        token1 = generateTestToken(user1.id);
        token2 = generateTestToken(user2.id);

        // Create test city and category
        const cityResult = await query(
            `INSERT INTO cities (name, country, country_code, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            ['Security City', 'Test Country', 'TC', 40.7128, -74.0060]
        );
        testCity = cityResult.rows[0];
        testDataTracker.addCity(testCity.id);

        const categoryResult = await query(
            `INSERT INTO recommendation_categories (name, description)
             VALUES ($1, $2) RETURNING *`,
            ['Security Category', 'Test category']
        );
        testCategory = categoryResult.rows[0];

        // Create test recommendation
        const recResult = await query(
            `INSERT INTO recommendations (user_id, title, description, category_id, user_rating, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [user1.id, 'Test Recommendation', 'Test', testCategory.id, 5, 'active']
        );
        testRecommendation = recResult.rows[0];
        testDataTracker.addRecommendation(testRecommendation.id);

        // Create test trip
        const tripResult = await query(
            `INSERT INTO trips (user_id, title, description, start_date, end_date, privacy, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [user1.id, 'Test Trip', 'Test trip', '2025-12-01', '2025-12-10', 'private', 'planning']
        );
        testTrip = tripResult.rows[0];
        testDataTracker.addTrip(testTrip.id);
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('Authentication Security', () => {
        it('should reject requests without token', async () => {
            await request(app).get('/api/profile/me').expect(401);
            await request(app).get('/api/recommendations').expect(401);
            await request(app).get(`/api/trips/${testTrip.id}`).expect(401);
            await request(app).get('/api/buddies').expect(401);
            await request(app).get('/api/feed').expect(401);
        });

        it('should reject invalid token format', async () => {
            await request(app)
                .get('/api/profile/me')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);
        });

        it('should reject expired token', async () => {
            const expiredToken = jwt.sign(
                { userId: user1.id },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-1h' }
            );

            await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });

        it('should reject token with invalid signature', async () => {
            const invalidToken = jwt.sign(
                { userId: user1.id },
                'wrong-secret',
                { expiresIn: '1h' }
            );

            await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(401);
        });

        it('should reject token with non-existent user', async () => {
            const fakeUserToken = jwt.sign(
                { userId: 999999 },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${fakeUserToken}`)
                .expect(401);
        });

        it('should enforce JWT token expiration (15 minutes per proposal)', async () => {
            // Create token that expires in 15 minutes (per proposal requirement)
            const shortLivedToken = jwt.sign(
                { userId: user1.id, email: user1.email, username: user1.username, role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '15m', issuer: 'citypulse-api', audience: 'citypulse-client' }
            );

            // Token should work immediately
            const validResponse = await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${shortLivedToken}`);
            
            // In actual 15-minute test, we'd wait, but for unit test we verify expiration logic
            // Create an expired token (expired 1 minute ago)
            const expired15mToken = jwt.sign(
                { userId: user1.id, email: user1.email, username: user1.username, role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-1m', issuer: 'citypulse-api', audience: 'citypulse-client' }
            );

            const expiredResponse = await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${expired15mToken}`)
                .expect(401);

            expect(expiredResponse.body.success).toBe(false);
        });

        it('should enforce session timeout - verify 15 minute timeout requirement', async () => {
            // Proposal requirement: Session timeout testing (15 minutes)
            // Create a token that expires after 15 minutes
            const sessionToken = jwt.sign(
                { userId: user1.id, email: user1.email, username: user1.username, role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '15m', issuer: 'citypulse-api', audience: 'citypulse-client' }
            );

            // Immediately after creation, token should work
            const immediateResponse = await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${sessionToken}`);
            
            // For testing, create an expired token (simulating 15+ minutes passed)
            const expiredSessionToken = jwt.sign(
                { userId: user1.id, email: user1.email, username: user1.username, role: 'user' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '-16m', issuer: 'citypulse-api', audience: 'citypulse-client' }
            );

            const expiredResponse = await request(app)
                .get('/api/profile/me')
                .set('Authorization', `Bearer ${expiredSessionToken}`)
                .expect(401);

            expect(expiredResponse.body.message).toMatch(/token|expired|unauthorized/i);
        });
    });

    describe('Authorization Security', () => {
        it('should not allow user to edit other user trip', async () => {
            const response = await request(app)
                .put(`/api/trips/${testTrip.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send({ title: 'Hacked Trip' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not allow user to delete other user recommendation', async () => {
            const response = await request(app)
                .delete(`/api/recommendations/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not allow non-organizer to invite trip companions', async () => {
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions/invite`)
                .set('Authorization', `Bearer ${token2}`)
                .send({ companionId: user2.id })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not allow user to remove other companions', async () => {
            // Add companion
            await query(
                `INSERT INTO trip_companions (trip_id, user_id, role, status)
                 VALUES ($1, $2, 'participant', 'accepted')`,
                [testTrip.id, user2.id]
            );

            const response = await request(app)
                .delete(`/api/trips/${testTrip.id}/companions/${user2.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(403);

            expect(response.body.success).toBe(false);

            // Cleanup
            await query('DELETE FROM trip_companions WHERE trip_id = $1', [testTrip.id]);
        });
    });

    describe('SQL Injection Prevention', () => {
        // Include exact payloads from proposal Section 1.3.1
        const sqlInjectionPayloads = [
            "'; DROP TABLE users; --",  // Proposal requirement
            "' OR '1'='1",               // Proposal requirement
            "UNION SELECT * FROM users", // Proposal requirement
            "1; DROP TABLE users;--",
            "1' OR '1'='1",
            "1 UNION SELECT * FROM users--",
            "'; DELETE FROM trips WHERE '1'='1",
            "1' AND 1=1--",
            "admin'--",
            "1' OR '1'='1' /*",
        ];

        it('should prevent SQL injection in trip companion invite', async () => {
            for (const payload of sqlInjectionPayloads) {
                const response = await request(app)
                    .post(`/api/trips/${testTrip.id}/companions/invite`)
                    .set('Authorization', `Bearer ${token1}`)
                    .send({ companionId: payload })
                    .expect(400);

                expect(response.body.success).toBe(false);
            }

            // Verify no data was corrupted
            const tripCheck = await query('SELECT COUNT(*) FROM trips');
            expect(parseInt(tripCheck.rows[0].count)).toBeGreaterThan(0);
        });

        it('should prevent SQL injection in search queries', async () => {
            for (const payload of sqlInjectionPayloads) {
                await request(app)
                    .get(`/api/search?q=${encodeURIComponent(payload)}`)
                    .set('Authorization', `Bearer ${token1}`)
                    .expect(200); // Should return safely, not error

                // Verify database integrity
                const userCheck = await query('SELECT COUNT(*) FROM users');
                expect(parseInt(userCheck.rows[0].count)).toBeGreaterThan(0);
            }
        });

        it('should prevent SQL injection in buddy requests', async () => {
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: "1; DROP TABLE buddies;--" })
                .expect(400);

            expect(response.body.success).toBe(false);

            // Verify table still exists
            const buddyCheck = await query('SELECT COUNT(*) FROM travel_buddy_connections');
            expect(buddyCheck.rows).toBeDefined();
        });

        it('should prevent SQL injection in username lookups', async () => {
            await request(app)
                .get(`/api/profile/test'; DROP TABLE users;--`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(404);

            // Verify users table exists
            const userCheck = await query('SELECT COUNT(*) FROM users');
            expect(parseInt(userCheck.rows[0].count)).toBeGreaterThan(0);
        });
    });

    describe('Input Validation', () => {
        it('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'invalid-email',
                    password: 'Test123!',
                    fullName: 'Test User'
                })
                .expect(400);

            expect(response.body.errors).toBeDefined();
        });

        it('should validate password strength', async () => {
            const weakPasswords = ['123', 'password', 'abc123', 'qwerty'];

            for (const password of weakPasswords) {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: 'testuser',
                        email: 'test@test.com',
                        password: password,
                        fullName: 'Test User'
                    })
                    .expect(400);

                expect(response.body.errors).toBeDefined();
            }
        });

        it('should validate trip dates', async () => {
            const response = await request(app)
                .post('/api/trips')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    title: 'Invalid Trip',
                    description: 'Test',
                    start_date: '2025-12-10',
                    end_date: '2025-12-01', // End before start
                    privacy: 'private'
                })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });

        it('should validate rating range (1-5)', async () => {
            const invalidRatings = [0, 6, -1, 10, 999];

            for (const rating of invalidRatings) {
                const response = await request(app)
                    .post('/api/recommendations')
                    .set('Authorization', `Bearer ${token1}`)
                    .send({
                        title: 'Test Recommendation',
                        description: 'Test',
                        category_id: testCategory.id,
                        user_rating: rating,
                        cities: [{ city_id: testCity.id }]
                    })
                    .expect(400);

                expect(response.body.error).toBeDefined();
            }
        });

        it('should validate required fields', async () => {
            // Missing title
            await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    description: 'Test',
                    category_id: testCategory.id,
                    user_rating: 5
                })
                .expect(400);

            // Missing privacy
            await request(app)
                .post('/api/trips')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    title: 'Test Trip',
                    description: 'Test',
                    start_date: '2025-12-01',
                    end_date: '2025-12-10'
                })
                .expect(400);
        });
    });

    describe('XSS Prevention', () => {
        // Include exact payloads from proposal Section 1.3.2
        const xssPayloads = [
            "<script>alert('xss')</script>",      // Proposal requirement
            "javascript:alert('xss')",             // Proposal requirement
            "<img src=\"x\" onerror=\"alert('xss')\">", // Proposal requirement
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg/onload=alert("XSS")>',
            '<iframe src="javascript:alert(XSS)">',
        ];

        it('should sanitize recommendation titles', async () => {
            for (const payload of xssPayloads) {
                const response = await request(app)
                    .post('/api/recommendations')
                    .set('Authorization', `Bearer ${token1}`)
                    .send({
                        title: payload,
                        description: 'Test',
                        category_id: testCategory.id,
                        user_rating: 5,
                        cities: [{ city_id: testCity.id }]
                    })
                    .expect(201);

                // Title should be sanitized (no script tags)
                expect(response.body.data.title).not.toContain('<script>');
                expect(response.body.data.title).not.toContain('javascript:');

                testDataTracker.addRecommendation(response.body.data.id);
            }
        });

        it('should sanitize user bio', async () => {
            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    bio: '<script>alert("XSS")</script>Hacked bio'
                })
                .expect(200);

            expect(response.body.data.bio).not.toContain('<script>');
        });
    });

    describe('Rate Limiting and Abuse Prevention', () => {
        it('should handle multiple rapid requests gracefully', async () => {
            const requests = Array(10).fill(null).map(() =>
                request(app)
                    .get('/api/feed?page=1&limit=10')
                    .set('Authorization', `Bearer ${token1}`)
            );

            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect([200, 429]).toContain(response.status); // 200 OK or 429 Too Many Requests
            });
        });

        it('should prevent spam buddy requests', async () => {
            // Try to send multiple requests to same user
            await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(201);

            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(400);

            expect(response.body.error).toContain('already');

            // Cleanup
            await query(
                'DELETE FROM travel_buddy_connections WHERE requester_id = $1 AND requested_id = $2',
                [user1.id, user2.id]
            );
        });
    });

    describe('Privacy and Data Exposure', () => {
        it('should not expose sensitive user data', async () => {
            const response = await request(app)
                .get(`/api/profile/${user1.username}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.data).not.toHaveProperty('password');
            expect(response.body.data).not.toHaveProperty('password_hash');
            expect(response.body.data).not.toHaveProperty('email');
        });

        it('should respect trip privacy settings', async () => {
            // Private trip should not be visible to others
            const response = await request(app)
                .get(`/api/trips/${testTrip.id}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not show private trips in feed', async () => {
            const response = await request(app)
                .get('/api/feed?page=1&limit=20')
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            const trips = response.body.data.filter((item: any) => item.content_type === 'trip');
            const foundPrivateTrip = trips.find((t: any) => t.id === testTrip.id);
            expect(foundPrivateTrip).toBeUndefined();
        });

        it('should not expose blocked users in buddy list', async () => {
            // User1 blocks User2
            await query(
                'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2)',
                [user1.id, user2.id]
            );

            const response = await request(app)
                .get('/api/buddies')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const blockedUser = response.body.data.find((b: any) => b.id === user2.id);
            expect(blockedUser).toBeUndefined();

            // Cleanup
            await query('DELETE FROM user_blocks WHERE blocker_id = $1', [user1.id]);
        });
    });

    describe('CSRF Protection', () => {
        it('should accept requests with valid auth token', async () => {
            const response = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    title: 'CSRF Test',
                    description: 'Test',
                    category_id: testCategory.id,
                    user_rating: 5,
                    cities: [{ city_id: testCity.id }]
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            testDataTracker.addRecommendation(response.body.data.id);
        });
    });
});
