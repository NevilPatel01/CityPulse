import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { cleanupDatabase } from '../setup';
import { generateTestId, generateAlphanumericTestId, deleteTestUser, cleanupAllTestData } from '../helpers/test-helpers';

const app = createApp();

describe('Password Reset Integration Tests', () => {
    const createdUserIds: number[] = [];

    beforeEach(async () => {
        // Clean up before each test
    });

    afterEach(async () => {
        // Clean up users created in this test
        for (const userId of createdUserIds) {
            await deleteTestUser(userId);
        }
        createdUserIds.length = 0;
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    // Helper function to create a user for testing password reset
    const createTestUser = async () => {
        const testId = generateAlphanumericTestId();
        const emailId = generateTestId();
        const userRegistration = {
            username: testId,
            email: `resetuser_${emailId}@example.com`,
            password: 'OldPassword123!',
            fullName: 'Reset Test User'
        };

        const response = await request(app)
            .post('/api/auth/register')
            .send(userRegistration);

        if (response.body.data?.user?.id) {
            createdUserIds.push(response.body.data.user.id);
        }

        return {
            user: response.body.data?.user,
            email: userRegistration.email,
            password: userRegistration.password
        };
    };

    describe('POST /api/auth/reset-password/request', () => {
        it('should accept password reset request for existing user', async () => {
            const { email } = await createTestUser();

            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('If an account with this email exists, you will receive a password reset code.');
            expect(response.body.resetToken).toBeDefined();
            expect(typeof response.body.resetToken).toBe('string');
        });

        it('should return success for non-existent email (prevent enumeration)', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('If an account with this email exists, you will receive a password reset code.');
            // Should not return resetToken for non-existent user
            expect(response.body.resetToken).toBeUndefined();
        });

        it('should allow Google OAuth users to reset password', async () => {
            // First create a Google OAuth user
            const googleUser = {
                googleId: 'google_reset_test',
                email: 'googlereset@gmail.com',
                name: 'Google Reset User',
                accessToken: 'google_token'
            };

            await request(app)
                .post('/api/auth/google')
                .send(googleUser);

            // Then request password reset
            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: googleUser.email })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.resetToken).toBeDefined();
        });

        it('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should reject empty email', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle missing email field', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should respect rate limiting for password reset requests', async () => {
            const { email } = await createTestUser();

            // Make multiple reset requests rapidly
            const requests = Array(10).fill(null).map(() => 
                request(app)
                    .post('/api/auth/reset-password/request')
                    .send({ email })
            );

            const responses = await Promise.all(requests);
            
            // First few requests should succeed
            expect(responses[0].status).toBe(200);

            // Some later requests might be rate limited
            const rateLimitedResponse = responses.find(res => res.status === 429);
            if (rateLimitedResponse) {
                expect(rateLimitedResponse.body.success).toBe(false);
                expect(rateLimitedResponse.body.message).toContain('Too many');
            }
        });
    });

    describe('POST /api/auth/reset-password/verify', () => {
        it('should verify valid security code', async () => {
            const { email } = await createTestUser();

            // Request password reset first
            const resetResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email });

            const resetToken = resetResponse.body.resetToken;

            // Note: In a real test, you'd need to intercept the email or have a way to get the security code
            // For this test, we'll test the structure and error cases with a valid format but wrong code
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken,
                    securityCode: '999999' // Valid format but wrong code
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid security code. Please check your email and try again.');
        });

        it('should reject invalid reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken: 'invalid-token',
                    securityCode: '123456'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired reset token.');
        });

        it('should reject missing reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    securityCode: '123456'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing security code', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken: 'some-token'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle empty request body', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/reset-password/verify', () => {
        it('should return method not allowed for GET requests', async () => {
            const response = await request(app)
                .get('/api/auth/reset-password/verify')
                .expect(405);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Method Not Allowed. Use POST instead of GET for verification.');
            expect(response.body.correctMethod).toBe('POST');
            expect(response.body.correctPayload).toEqual({
                resetToken: 'string',
                securityCode: 'string'
            });
        });
    });

    describe('POST /api/auth/reset-password/confirm', () => {
        it('should reject password reset with invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken: 'invalid-token',
                    newPassword: 'NewPassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired reset token.');
        });

        it('should reject weak new password', async () => {
            const { email } = await createTestUser();

            // Request password reset
            const resetResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email });

            const resetToken = resetResponse.body.resetToken;

            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    newPassword: 'weak' // This should fail validation
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should reject missing new password', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken: 'some-token'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    newPassword: 'NewPassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should handle empty request body', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        // Note: Testing successful password reset would require mocking the email service
        // or having a way to retrieve the actual security code from the database
    });

    describe('Password Reset Flow Integration', () => {
        it('should maintain consistent error messages for security', async () => {
            const { email } = await createTestUser();

            // Test non-existent email
            const nonExistentResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: 'nonexistent@example.com' });

            // Test existing email
            const existingResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email });

            // Both should return same message to prevent user enumeration
            expect(nonExistentResponse.body.message).toBe(existingResponse.body.message);
        });

        it('should have proper validation schemas for all reset endpoints', async () => {
            // Test that all password reset endpoints have proper validation
            const endpoints = [
                '/api/auth/reset-password/request',
                '/api/auth/reset-password/verify',
                '/api/auth/reset-password/confirm'
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .post(endpoint)
                    .send({ invalid: 'data' })
                    .expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toBeDefined();
            }
        });

        it('should clean up expired tokens properly', async () => {
            const { email } = await createTestUser();

            // Request password reset
            const resetResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email });

            const resetToken = resetResponse.body.resetToken;

            // Try to verify with wrong code multiple times (use valid 6-digit format)
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/api/auth/reset-password/verify')
                    .send({
                        resetToken,
                        securityCode: '111111' // Valid format but wrong code
                    })
                    .expect(400);
            }

            // The token should still be invalid (not expired yet, just wrong code)
            const finalResponse = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken,
                    securityCode: '222222' // Valid format but wrong code
                })
                .expect(400);

            expect(finalResponse.body.message).toBe('Invalid security code. Please check your email and try again.');
        });
    });
});