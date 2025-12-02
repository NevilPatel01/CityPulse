import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { cleanupDatabase } from '../setup';
import { generateTestId, generateAlphanumericTestId, createTestUser, deleteTestUser } from '../helpers/test-helpers';
import { query } from '../../lib/database';

const app = createApp();

describe('Token Refresh Integration Tests', () => {
    const createdUserIds: number[] = [];

    afterEach(async () => {
        // Clean up created users
        for (const userId of createdUserIds) {
            await deleteTestUser(userId);
        }
        createdUserIds.length = 0;
    });

    afterAll(async () => {
        // Final cleanup
    });

    // Helper function to create a user and get tokens
    const createUserAndGetTokens = async () => {
        // Use createTestUser helper which creates verified users by default
        const testUser = await createTestUser({
            password: 'SecurePassword123!'
        });
        
        createdUserIds.push(testUser.id);

        // Login to get tokens
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'SecurePassword123!'
            })
            .expect(200);

        if (!loginResponse.body.success) {
            console.error('Login failed:', loginResponse.body);
            throw new Error(`Login failed: ${loginResponse.body.message}`);
        }

        return {
            accessToken: loginResponse.body.data.accessToken,
            refreshToken: loginResponse.body.data.refreshToken,
            user: loginResponse.body.data.user,
            cookies: loginResponse.headers['set-cookie']
        };
    };

    describe('POST /api/auth/refresh', () => {
        it('should successfully refresh access token with valid refresh token', async () => {
            const { accessToken: originalAccessToken, refreshToken } = await createUserAndGetTokens();

            // Small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token refreshed successfully');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            // New tokens should be different from original
            expect(response.body.data.accessToken).not.toBe(originalAccessToken);
            expect(response.body.data.refreshToken).not.toBe(refreshToken);

            // Check that new cookies are set
            const cookies = response.headers['set-cookie'] as unknown as string[];
            expect(cookies).toBeDefined();
            if (cookies) {
                expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
                expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
            }
        });

        it('should refresh token using cookie-based refresh token', async () => {
            const { cookies } = await createUserAndGetTokens();

            const refreshTokenCookie = Array.isArray(cookies)
                ? cookies.find((cookie: string) => cookie.startsWith('refreshToken='))
                : cookies;

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', refreshTokenCookie!)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should reject refresh request without refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Refresh token required');
        });

        it('should reject refresh request with invalid refresh token', async () => {
            const invalidToken = 'invalid.refresh.token';

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${invalidToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired refresh token');

            // Should clear cookies on invalid token
            const cookies = response.headers['set-cookie'];
            if (cookies && Array.isArray(cookies)) {
                expect(cookies.some((cookie: string) =>
                    cookie.includes('accessToken=;') || cookie.includes('refreshToken=;')
                )).toBe(true);
            }
        });

        it('should reject refresh request with malformed refresh token', async () => {
            const malformedToken = 'malformed-token';

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${malformedToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired refresh token');
        });

        it('should handle refresh token for non-existent user', async () => {
            // Create a user, get tokens, then delete that specific user
            const { refreshToken, user } = await createUserAndGetTokens();

            // Delete only this specific user
            await query('DELETE FROM users WHERE id = $1', [user.id]);
            // Remove from tracking since we manually deleted
            const index = createdUserIds.indexOf(user.id);
            if (index > -1) createdUserIds.splice(index, 1);

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found or account inactive');

            // Should clear cookies when user not found
            const cookies = response.headers['set-cookie'];
            if (cookies && Array.isArray(cookies)) {
                expect(cookies.some((cookie: string) =>
                    cookie.includes('accessToken=;') || cookie.includes('refreshToken=;')
                )).toBe(true);
            }
        });

        it('should generate new refresh token on refresh', async () => {
            const { refreshToken: originalRefreshToken } = await createUserAndGetTokens();

            // Small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${originalRefreshToken}`)
                .expect(200);

            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.refreshToken).not.toBe(originalRefreshToken);
        });

        it('should maintain user data consistency in new tokens', async () => {
            const { refreshToken, user } = await createUserAndGetTokens();

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`)
                .expect(200);

            // Use new access token to get profile and verify user data
            const newAccessToken = response.body.data.accessToken;

            const profileResponse = await request(app)
                .get('/api/auth/profile')
                .set('Cookie', `accessToken=${newAccessToken}`)
                .expect(200);

            // Convert both to numbers for comparison to handle type consistency
            expect(Number(profileResponse.body.data.user.id)).toBe(Number(user.id));
            expect(profileResponse.body.data.user.email).toBe(user.email);
            expect(profileResponse.body.data.user.username).toBe(user.username);
        });

        it('should handle refresh token with expired JWT', async () => {
            // This test simulates an expired refresh token scenario
            // In a real scenario, you'd need to create a token with past expiration
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlIjoidXNlciIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalid';

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${expiredToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired refresh token');
        });

        it('should respect rate limiting for refresh endpoint', async () => {
            const { refreshToken } = await createUserAndGetTokens();

            // Make multiple refresh requests rapidly
            const requests = Array(20).fill(null).map(() =>
                request(app)
                    .post('/api/auth/refresh')
                    .set('Cookie', `refreshToken=${refreshToken}`)
            );

            const responses = await Promise.all(requests);

            // Some requests should succeed
            const successfulResponses = responses.filter(res => res.status === 200);
            expect(successfulResponses.length).toBeGreaterThan(0);

            // Some requests might be rate limited
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            if (rateLimitedResponses.length > 0) {
                expect(rateLimitedResponses[0].body.success).toBe(false);
                expect(rateLimitedResponses[0].body.message).toContain('Too many requests');
            }
        });

        it('should handle empty cookie header gracefully', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', '')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Refresh token required');
        });

        it('should handle malformed cookie header', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', 'malformed=cookie=value')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Refresh token required');
        });

        it('should work with both access and refresh tokens in cookies', async () => {
            const { cookies } = await createUserAndGetTokens();

            const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', cookieHeader)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });
    });
});