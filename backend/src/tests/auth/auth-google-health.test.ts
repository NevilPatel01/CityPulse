/**
 * Google OAuth and Health Check Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import {
    createGoogleTestUser,
    deleteTestUser,
    generateTestId,
    cleanupAllTestData
} from '../helpers/test-helpers';

const app = createApp();

describe('Google OAuth Authentication', () => {
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

    describe('POST /api/auth/google', () => {
        it('should successfully authenticate new Google user', async () => {
            const testId = generateTestId();
            const googleUser = {
                googleId: `google_${testId}`,
                email: `google_${testId}@gmail.com`,
                name: 'Google Test User',
                picture: 'https://example.com/photo.jpg',
                accessToken: `google_access_token_${testId}`
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(googleUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('successful');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(googleUser.email);
            expect(response.body.data.user.id).toBeDefined();
            expect(response.body.data.user.username).toBeDefined();
            expect(response.body.data.user.fullName).toBe(googleUser.name);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            createdUserIds.push(response.body.data.user.id);
        });

        it('should login existing Google user', async () => {
            // Create Google user first
            const googleUser = await createGoogleTestUser();
            createdUserIds.push(googleUser.id);

            // Try to login with same Google account
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    googleId: googleUser.google_id,
                    email: googleUser.email,
                    name: googleUser.full_name,
                    accessToken: 'google_token'
                });

            if (response.status !== 200) {
            }

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.id).toBe(googleUser.id);
            expect(response.body.data.user.email).toBe(googleUser.email);
        });

        it('should reject missing Google ID', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    email: 'test@gmail.com',
                    name: 'Test User',
                    accessToken: 'token'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing email', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    googleId: 'google123',
                    name: 'Test User',
                    accessToken: 'token'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing name', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    googleId: 'google123',
                    email: 'test@gmail.com',
                    accessToken: 'token'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should allow missing access token', async () => {
            // The API doesn't actually require accessToken
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    googleId: 'google123',
                    email: 'test@gmail.com',
                    name: 'Test User'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            createdUserIds.push(response.body.data.user.id);
        });

        it('should handle Google user with profile picture', async () => {
            const testId = generateTestId();
            const googleUser = {
                googleId: `google_pic_${testId}`,
                email: `googlepic_${testId}@gmail.com`,
                name: 'Google User With Picture',
                picture: 'https://lh3.googleusercontent.com/a/test-photo',
                accessToken: `google_token_${testId}`
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(googleUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();

            createdUserIds.push(response.body.data.user.id);
        });
    });
});

describe('Health Check Endpoints', () => {
    describe('GET /api/health', () => {
        it('should return healthy status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Server is healthy');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.timestamp).toBeDefined();
            expect(response.body.data.database).toBeDefined();
            expect(response.body.data.database.connected).toBe(true);
        });

        it('should include database connection time', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.data.database.currentTime).toBeDefined();
            const dbTime = new Date(response.body.data.database.currentTime);
            expect(dbTime).toBeInstanceOf(Date);
            expect(isNaN(dbTime.getTime())).toBe(false);
        });

        it('should respond quickly (performance check)', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/health')
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });
    });

    describe('GET /api/health/schema', () => {
        it('should return database schema information', async () => {
            const response = await request(app)
                .get('/api/health/schema')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.existingTables).toBeDefined();
            expect(Array.isArray(response.body.data.existingTables)).toBe(true);
            expect(response.body.data.allTablesPresent).toBeDefined();
        });

        it('should include expected tables', async () => {
            const response = await request(app)
                .get('/api/health/schema')
                .expect(200);

            const existingTables = response.body.data.existingTables;

            // Check for essential tables (controller only checks users and user_profiles)
            expect(existingTables).toContain('users');
            expect(existingTables).toContain('user_profiles');
        });

        it('should report all required tables present', async () => {
            const response = await request(app)
                .get('/api/health/schema')
                .expect(200);

            // Should have no missing tables if setup is correct
            expect(response.body.data.missingTables).toBeDefined();
            expect(Array.isArray(response.body.data.missingTables)).toBe(true);
            expect(response.body.data.allTablesPresent).toBe(true);
        });
    });
});
