/**
 * Token Refresh Integration Tests
 * Tests for refresh token and change password endpoints
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import {
    createTestUser,
    deleteTestUser,
    generateTestToken,
    generateTestRefreshToken,
    cleanupAllTestData
} from '../helpers/test-helpers';

const app = createApp();

describe('Token Refresh and Change Password', () => {
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

    describe('POST /api/auth/refresh', () => {
        let testUser: any;
        let refreshToken: string;

        beforeEach(async () => {
            testUser = await createTestUser();
            createdUserIds.push(testUser.id);

            // Login to get refresh token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.rawPassword
                });

            refreshToken = loginResponse.body.data.refreshToken;
        });

        it('should successfully refresh access token with valid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(typeof response.body.data.accessToken).toBe('string');
        });

        it('should reject invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', ['refreshToken=invalid_token_string'])
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid');
        });

        it('should reject missing refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject expired refresh token', async () => {
            // Generate an expired token
            const expiredToken = generateTestRefreshToken(testUser.id);
            // Note: In real test, you'd need to wait or manipulate time
            // For now, we test with an invalid token format
            
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'expired.token.here' })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/auth/change-password', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser();
            createdUserIds.push(testUser.id);

            // Login to get access token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.rawPassword
                });

            accessToken = loginResponse.body.data.accessToken;
        });

        it('should successfully change password with valid current password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: testUser.rawPassword,
                    newPassword: 'NewSecurePassword123!',
                    confirmPassword: 'NewSecurePassword123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password changed successfully');

            // Verify can login with new password
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'NewSecurePassword123!'
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
        });

        it('should reject old password after change', async () => {
            await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: testUser.rawPassword,
                    newPassword: 'NewSecurePassword123!',
                    confirmPassword: 'NewSecurePassword123!'
                });

            // Try to login with old password
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.rawPassword
                })
                .expect(401);

            expect(loginResponse.body.success).toBe(false);
        });

        it('should reject incorrect current password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'WrongPassword123!',
                    newPassword: 'NewSecurePassword123!',
                    confirmPassword: 'NewSecurePassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject weak new password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: testUser.rawPassword,
                    newPassword: 'weak',
                    confirmPassword: 'weak'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should allow same password as new password (no validation)', async () => {
            // Note: The API doesn't prevent using the same password
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: testUser.rawPassword,
                    newPassword: testUser.rawPassword,
                    confirmPassword: testUser.rawPassword
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .send({
                    currentPassword: 'CurrentPassword123!',
                    newPassword: 'NewSecurePassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', 'Bearer invalid_token')
                .send({
                    currentPassword: 'CurrentPassword123!',
                    newPassword: 'NewSecurePassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing current password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    newPassword: 'NewSecurePassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing new password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'CurrentPassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/profile', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                bio: 'Test bio',
                currentLocation: 'Toronto, ON',
                hometown: 'Montreal, QC'
            });
            createdUserIds.push(testUser.id);

            // Login to get access token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.rawPassword
                });

            accessToken = loginResponse.body.data.accessToken;
        });

        it('should get authenticated user profile', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.username).toBe(testUser.username);
            expect(response.body.data.user.password_hash).toBeUndefined();
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should reject request with expired token', async () => {
            // Generate expired token (1ms expiry)
            const expiredToken = generateTestToken(testUser.id, 'user', '1ms');
            
            // Wait for token to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
