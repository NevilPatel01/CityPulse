import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import { generateTestToken } from '../setup';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateTestId, generateAlphanumericTestId } from '../helpers/test-helpers';

describe('Email Verification API Tests', () => {
    const app = createApp();
    let testUser: any;
    let authToken: string;
    const testId = generateTestId();
    const alphaTestId = generateAlphanumericTestId();

    beforeAll(async () => {
        // Create unverified test user
        const userResult = await query(
            `INSERT INTO users (username, email, password_hash, full_name, email_verified)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email`,
            [
                `testuser_${alphaTestId}`,
                `test_${testId}@example.com`,
                '$2b$10$testhash',
                `Test User ${testId}`,
                false
            ]
        );
        testUser = userResult.rows[0];
        authToken = generateTestToken(testUser.id);
    });

    afterAll(async () => {
        // Clean up
        await query('DELETE FROM email_verifications WHERE user_id = $1', [testUser.id]);
        await query('DELETE FROM users WHERE id = $1', [testUser.id]);
    });

    describe('POST /api/auth/resend-verification', () => {
        it('should resend verification email for unverified user', async () => {
            const response = await request(app)
                .post('/api/auth/resend-verification')
                .send({ email: testUser.email })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Verification email sent');

            // Verify token created in database
            const result = await query(
                'SELECT * FROM email_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
                [testUser.id]
            );
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].token).toBeDefined();
        });

        it('should return success for already verified user', async () => {
            // Mark user as verified
            await query(
                'UPDATE users SET email_verified = TRUE WHERE id = $1',
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/resend-verification')
                .send({ email: testUser.email })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('already verified');

            // Reset to unverified
            await query(
                'UPDATE users SET email_verified = FALSE WHERE id = $1',
                [testUser.id]
            );
        });

        it('should return success for non-existent email (security)', async () => {
            const response = await request(app)
                .post('/api/auth/resend-verification')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/resend-verification')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require email field', async () => {
            const response = await request(app)
                .post('/api/auth/resend-verification')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login - Email Verification Check', () => {
        it('should block login for unverified email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'TestPassword123!'
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('EMAIL_NOT_VERIFIED');
            expect(response.body.message).toContain('verify your email');
        });

        it('should allow login for verified email', async () => {
            // Mark as verified
            await query(
                'UPDATE users SET email_verified = TRUE WHERE id = $1',
                [testUser.id]
            );

            // Update password to match test password
            const { hashPassword } = await import('../../utils/auth');
            const hashedPassword = await hashPassword('TestPassword123!');
            await query(
                'UPDATE users SET password_hash = $1 WHERE id = $2',
                [hashedPassword, testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'TestPassword123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
        });
    });
});
