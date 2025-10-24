/**
 * Profile Integration Tests  
 * Tests for profile CRUD operations and statistics
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import {
    createTestUser,
    deleteTestUser,
    generateTestToken,
    createTestRecommendation,
    cleanupAllTestData
} from '../helpers/test-helpers';
import { query } from '../../lib/database';

const app = createApp();

describe('Profile Management', () => {
    const createdUserIds: number[] = [];

    afterEach(async () => {
        for (const userId of createdUserIds) {
            await deleteTestUser(userId);
        }
        createdUserIds.length = 0;
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('GET /api/profile/:username', () => {
        let testUser: any;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'TestPassword123!',
                bio: 'Test bio',
                currentLocation: 'Toronto, ON',
                hometown: 'Montreal, QC',
                phone: '+1234567890'
            });
            createdUserIds.push(testUser.id);
        });

        it('should get user profile by username', async () => {
            const response = await request(app)
                .get(`/api/profile/${testUser.username}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.username).toBe(testUser.username);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.full_name).toBe(testUser.full_name);
            expect(response.body.data.user.bio).toBe('Test bio');
            expect(response.body.data.user.password_hash).toBeUndefined();
        });

        it('should include user statistics in profile', async () => {
            const response = await request(app)
                .get(`/api/profile/${testUser.username}`)
                .expect(200);

            expect(response.body.data.user.stats).toBeDefined();
            expect(response.body.data.user.stats.cities).toBeDefined();
            expect(response.body.data.user.stats.recommendations).toBeDefined();
            expect(response.body.data.user.stats.travelBuddies).toBeDefined();
            expect(response.body.data.user.stats.points).toBeDefined();
        });

        it('should return 404 for non-existent username', async () => {
            const response = await request(app)
                .get('/api/profile/nonexistentuser')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not found');
        });

        it('should get profile for user with recommendations', async () => {
            // Create recommendations for user
            await createTestRecommendation(testUser.id, {
                title: 'Test Recommendation 1',
                category: 'Food'
            });
            await createTestRecommendation(testUser.id, {
                title: 'Test Recommendation 2',
                category: 'Culture'
            });

            const response = await request(app)
                .get(`/api/profile/${testUser.username}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.stats.recommendations).toBeGreaterThanOrEqual(2);
        });
    });

    describe('PUT /api/profile', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'TestPassword123!',
                bio: 'Original bio',
                currentLocation: 'Toronto, ON'
            });
            createdUserIds.push(testUser.id);

            accessToken = generateTestToken(testUser.id);
        });

        it('should update user profile with valid data', async () => {
            const updateData = {
                fullName: 'Updated Name',
                bio: 'Updated bio content',
                currentLocation: 'Vancouver, BC',
                hometown: 'Calgary, AB',
                phone: '+1987654321'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('updated');
            expect(response.body.data.full_name).toBe(updateData.fullName);
            expect(response.body.data.bio).toBe(updateData.bio);
            expect(response.body.data.current_location).toBe(updateData.currentLocation);
            expect(response.body.data.hometown).toBe(updateData.hometown);
        });

        it('should update only specified fields', async () => {
            const updateData = {
                bio: 'Only updating bio'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.bio).toBe('Only updating bio');
            expect(response.body.data.current_location).toBe('Toronto, ON'); // Should remain unchanged
        });

        it('should reject update without authentication', async () => {
            const response = await request(app)
                .put('/api/profile')
                .send({ bio: 'New bio' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject invalid phone number format', async () => {
            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ phone: 'invalid-phone' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('validation');
        });

        it('should allow clearing optional fields', async () => {
            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    bio: null,
                    phone: null
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.bio).toBeNull();
            expect(response.body.data.phone).toBeNull();
        });
    });

    describe('POST /api/profile/photo', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'TestPassword123!'
            });
            createdUserIds.push(testUser.id);

            accessToken = generateTestToken(testUser.id);
        });

        it('should upload profile photo successfully', async () => {
            const response = await request(app)
                .post('/api/profile/photo')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('photo', Buffer.from('fake-image-data'), {
                    filename: 'profile.jpg',
                    contentType: 'image/jpeg'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('uploaded');
            expect(response.body.data.profilePhotoUrl).toBeDefined();
            expect(response.body.data.profilePhotoUrl).toContain('/uploads/profiles/');
        });

        it('should reject upload without authentication', async () => {
            const response = await request(app)
                .post('/api/profile/photo')
                .attach('photo', Buffer.from('fake-image-data'), {
                    filename: 'profile.jpg',
                    contentType: 'image/jpeg'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject upload without photo file', async () => {
            const response = await request(app)
                .post('/api/profile/photo')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('No file');
        });

        it('should reject non-image file types', async () => {
            const response = await request(app)
                .post('/api/profile/photo')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('photo', Buffer.from('fake-pdf-data'), {
                    filename: 'document.pdf',
                    contentType: 'application/pdf'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid file type');
        });

        it('should reject oversized files', async () => {
            // Create a buffer larger than the allowed size (assuming 5MB limit)
            const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

            const response = await request(app)
                .post('/api/profile/photo')
                .set('Authorization', `Bearer ${accessToken}`)
                .attach('photo', largeBuffer, {
                    filename: 'large-photo.jpg',
                    contentType: 'image/jpeg'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('too large');
        });
    });

    describe('GET /api/profile/stats', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'TestPassword123!'
            });
            createdUserIds.push(testUser.id);

            accessToken = generateTestToken(testUser.id);

            // Create some test data for statistics
            await createTestRecommendation(testUser.id, { title: 'Rec 1' });
            await createTestRecommendation(testUser.id, { title: 'Rec 2' });

            // Add user activities for points
            await query(
                'INSERT INTO user_activities (user_id, activity_type, points) VALUES ($1, $2, $3)',
                [testUser.id, 'recommendation_created', 50]
            );
            await query(
                'INSERT INTO user_activities (user_id, activity_type, points) VALUES ($1, $2, $3)',
                [testUser.id, 'profile_completed', 100]
            );
        });

        it('should get user statistics', async () => {
            const response = await request(app)
                .get('/api/profile/stats')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.cities).toBeDefined();
            expect(response.body.data.recommendations).toBeGreaterThanOrEqual(2);
            expect(response.body.data.travelBuddies).toBeDefined();
            expect(response.body.data.points).toBeGreaterThanOrEqual(150);
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/profile/stats')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/profile/badges', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'TestPassword123!'
            });
            createdUserIds.push(testUser.id);

            accessToken = generateTestToken(testUser.id);
        });

        it('should get user badges', async () => {
            const response = await request(app)
                .get('/api/profile/badges')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.badges).toBeDefined();
            expect(Array.isArray(response.body.data.badges)).toBe(true);
        });

        it('should return empty badges for new user', async () => {
            const response = await request(app)
                .get('/api/profile/badges')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.data.badges.length).toBe(0);
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/profile/badges')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Profile Privacy Settings', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'TestPassword123!'
            });
            createdUserIds.push(testUser.id);

            accessToken = generateTestToken(testUser.id);
        });

        it('should update profile visibility to private', async () => {
            await query(
                'UPDATE user_profiles SET profile_visibility = $1 WHERE user_id = $2',
                ['private', testUser.id]
            );

            const response = await request(app)
                .get(`/api/profile/${testUser.username}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            // Profile should still be visible but with limited info for private profiles
        });

        it('should update social links visibility', async () => {
            await query(
                'UPDATE user_profiles SET social_links_visible = $1 WHERE user_id = $2',
                [false, testUser.id]
            );

            const response = await request(app)
                .get(`/api/profile/${testUser.username}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});
