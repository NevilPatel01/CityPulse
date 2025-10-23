/**
 * Password Reset Integration Tests
 * Tests for password reset request, verify, and confirm endpoints
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import {
    createTestUser,
    createGoogleTestUser,
    deleteTestUser,
    createPasswordResetToken,
    cleanupAllTestData
} from '../helpers/test-helpers';

const app = createApp();

describe('Password Reset Flow', () => {
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

    describe('POST /api/auth/reset-password/request', () => {
        let testUser: any;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'OldPassword123!'
            });
            createdUserIds.push(testUser.id);
        });

        it('should accept password reset request for existing user', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: testUser.email })
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
            expect(response.body.resetToken).toBeUndefined();
        });

        it('should allow Google OAuth users to reset password', async () => {
            const googleUser = await createGoogleTestUser();
            createdUserIds.push(googleUser.id);

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

        it('should reject missing email field', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/request')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/reset-password/verify', () => {
        let testUser: any;
        let resetToken: string;
        let securityCode: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'OldPassword123!'
            });
            createdUserIds.push(testUser.id);

            // Request password reset
            const resetResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: testUser.email });

            resetToken = resetResponse.body.resetToken;

            // Get security code from database
            const tokenData = await createPasswordResetToken(testUser.id, testUser.email);
            securityCode = tokenData.securityCode;
        });

        it('should verify valid reset token and security code', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken,
                    securityCode
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Security code verified successfully');
        });

        it('should reject invalid security code', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken,
                    securityCode: '999999'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid or expired');
        });

        it('should reject invalid reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken: 'invalid_token',
                    securityCode
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    securityCode
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing security code', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({
                    resetToken
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject GET request to verify endpoint', async () => {
            const response = await request(app)
                .get('/api/auth/reset-password/verify')
                .expect(405);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Method Not Allowed');
            expect(response.body.correctMethod).toBe('POST');
        });
    });

    describe('POST /api/auth/reset-password/confirm', () => {
        let testUser: any;
        let resetToken: string;
        let securityCode: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'OldPassword123!'
            });
            createdUserIds.push(testUser.id);

            // Request password reset and get tokens
            const resetResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: testUser.email });

            resetToken = resetResponse.body.resetToken;
            const tokenData = await createPasswordResetToken(testUser.id, testUser.email);
            securityCode = tokenData.securityCode;

            // Verify the code first
            await request(app)
                .post('/api/auth/reset-password/verify')
                .send({ resetToken, securityCode });
        });

        it('should successfully reset password with valid token', async () => {
            const newPassword = 'NewSecurePassword123!';

            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    securityCode,
                    newPassword
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password reset successfully');

            // Verify can login with new password
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: newPassword
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
        });

        it('should reject old password after reset', async () => {
            const newPassword = 'NewSecurePassword123!';

            await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    securityCode,
                    newPassword
                });

            // Try to login with old password
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'OldPassword123!'
                })
                .expect(401);

            expect(loginResponse.body.success).toBe(false);
        });

        it('should reject weak new password', async () => {
            const testUser = await createTestUser();
            createdUserIds.push(testUser.id);

            const resetToken = await createPasswordResetToken(testUser.id, testUser.email);

            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    newPassword: 'weak'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should reject invalid reset token', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken: 'invalid_token',
                    securityCode,
                    newPassword: 'NewPassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject missing new password', async () => {
            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    securityCode
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should prevent reuse of used reset token', async () => {
            const newPassword = 'NewSecurePassword123!';

            // Use token once
            await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    securityCode,
                    newPassword
                });

            // Try to use same token again
            const response = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    securityCode,
                    newPassword: 'AnotherPassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid or expired');
        });
    });

    describe('Complete Password Reset Flow', () => {
        it('should complete full password reset flow successfully', async () => {
            // Create user
            const testUser = await createTestUser({
                password: 'OriginalPassword123!'
            });
            createdUserIds.push(testUser.id);

            // Step 1: Request password reset
            const requestResponse = await request(app)
                .post('/api/auth/reset-password/request')
                .send({ email: testUser.email })
                .expect(200);

            expect(requestResponse.body.success).toBe(true);
            const resetToken = requestResponse.body.resetToken;

            // Get security code
            const tokenData = await createPasswordResetToken(testUser.id, testUser.email);
            const securityCode = tokenData.securityCode;

            // Step 2: Verify security code
            const verifyResponse = await request(app)
                .post('/api/auth/reset-password/verify')
                .send({ resetToken, securityCode })
                .expect(200);

            expect(verifyResponse.body.success).toBe(true);

            // Step 3: Confirm new password
            const newPassword = 'BrandNewPassword123!';
            const confirmResponse = await request(app)
                .post('/api/auth/reset-password/confirm')
                .send({
                    resetToken,
                    securityCode,
                    newPassword
                })
                .expect(200);

            expect(confirmResponse.body.success).toBe(true);

            // Step 4: Login with new password
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: newPassword
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.data.user.id).toBe(testUser.id);
        });
    });
});
