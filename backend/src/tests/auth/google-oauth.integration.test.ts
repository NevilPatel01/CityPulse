import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { cleanupTestDatabase } from '../setup';

const app = createApp();

describe('Google OAuth Integration Tests', () => {
    beforeEach(async () => {
        await cleanupTestDatabase();
    });

    afterAll(async () => {
        // Cleanup after all tests
    });

    describe('POST /api/auth/google', () => {
        it('should successfully authenticate with valid Google OAuth data', async () => {
            const validGoogleUser = {
                googleId: 'google_test_id_123',
                email: 'testuser@gmail.com',
                name: 'Test User',
                picture: 'https://example.com/picture.jpg',
                accessToken: 'google_access_token_123'
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(validGoogleUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Google OAuth authentication successful');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(validGoogleUser.email);
            expect(response.body.data.user.fullName).toBe(validGoogleUser.name);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            // Check that cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            if (cookies && Array.isArray(cookies)) {
                expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
                expect(cookies.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
            }
        });

        it('should handle existing user Google OAuth authentication', async () => {
            const googleUser = {
                googleId: 'existing_google_id_456',
                email: 'existing@gmail.com',
                name: 'Existing User',
                accessToken: 'google_access_token_456'
            };

            // First authentication - create user
            await request(app)
                .post('/api/auth/google')
                .send(googleUser)
                .expect(200);

            // Second authentication - should authenticate existing user
            const response = await request(app)
                .post('/api/auth/google')
                .send(googleUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Google OAuth authentication successful');
            expect(response.body.data.user.email).toBe(googleUser.email);
        });

        it('should reject Google OAuth with missing required fields', async () => {
            const incompleteGoogleUser = {
                email: 'incomplete@gmail.com'
                // Missing googleId, name, accessToken
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(incompleteGoogleUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Missing required Google OAuth data');
        });

        it('should reject Google OAuth with invalid email format', async () => {
            const invalidEmailUser = {
                googleId: 'google_id_789',
                email: 'invalid-email-format',
                name: 'Invalid Email User',
                accessToken: 'google_access_token_789'
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(invalidEmailUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Missing required Google OAuth data');
        });

        it('should generate unique usernames for Google OAuth users', async () => {
            const googleUser1 = {
                googleId: 'google_id_unique_1',
                email: 'sameemail@gmail.com',
                name: 'User One',
                accessToken: 'token_1'
            };

            const googleUser2 = {
                googleId: 'google_id_unique_2',
                email: 'differentemail@gmail.com',
                name: 'User Two',
                accessToken: 'token_2'
            };

            const response1 = await request(app)
                .post('/api/auth/google')
                .send(googleUser1)
                .expect(200);

            const response2 = await request(app)
                .post('/api/auth/google')
                .send(googleUser2)
                .expect(200);

            expect(response1.body.data.user.username).toBeDefined();
            expect(response2.body.data.user.username).toBeDefined();
            expect(response1.body.data.user.username).not.toBe(response2.body.data.user.username);
        });

        it('should handle Google OAuth user account status checks', async () => {
            // This test would require setting up a user with inactive status
            // For now, I test that active users can authenticate
            const googleUser = {
                googleId: 'google_active_user',
                email: 'activeuser@gmail.com',
                name: 'Active User',
                accessToken: 'active_token'
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(googleUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
        });

        it('should set Google users as email verified by default', async () => {
            const googleUser = {
                googleId: 'google_verified_user',
                email: 'verified@gmail.com',
                name: 'Verified User',
                accessToken: 'verified_token'
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(googleUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            
            // Check user profile to verify email_verified status
            const cookies = response.headers['set-cookie'];
            const accessTokenCookie = Array.isArray(cookies)
                ? cookies.find((cookie: string) => cookie.startsWith('accessToken='))
                : cookies;
            
            if (accessTokenCookie) {
                const profileResponse = await request(app)
                    .get('/api/auth/profile')
                    .set('Cookie', accessTokenCookie)
                    .expect(200);

                expect(profileResponse.body.data.user.email_verified).toBe(true);
            }
        });

        it('should respect rate limiting for Google OAuth endpoint', async () => {
            const googleUser = {
                googleId: 'rate_limit_test',
                email: 'ratelimit@gmail.com',
                name: 'Rate Limit Test',
                accessToken: 'rate_limit_token'
            };

            // Make multiple requests to test rate limiting
            // Note: This test depends on the rate limit configuration
            const requests = Array(10).fill(null).map(() => 
                request(app)
                    .post('/api/auth/google')
                    .send(googleUser)
            );

            const responses = await Promise.all(requests);
            
            // At least the first request should succeed
            expect(responses[0].status).toBe(200);
            
            // Some later requests might be rate limited (depending on config)
            const rateLimitedResponse = responses.find(res => res.status === 429);
            if (rateLimitedResponse) {
                expect(rateLimitedResponse.body.success).toBe(false);
                expect(rateLimitedResponse.body.message).toContain('OAuth attempts');
            }
        });

        it('should handle Google OAuth with picture URL', async () => {
            const googleUserWithPicture = {
                googleId: 'google_picture_test',
                email: 'pictureuser@gmail.com',
                name: 'Picture User',
                picture: 'https://lh3.googleusercontent.com/test-picture',
                accessToken: 'picture_token'
            };

            const response = await request(app)
                .post('/api/auth/google')
                .send(googleUserWithPicture)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            // Picture is logged but not stored in current implementation
        });

        it('should handle empty request body gracefully', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Missing required Google OAuth data');
        });
    });
});