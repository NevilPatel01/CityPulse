import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import { generateTestToken } from '../setup';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateTestId, generateAlphanumericTestId } from '../helpers/test-helpers';
import { hashPassword } from '../../utils/auth';

describe('Account Deactivation API Tests', () => {
    const app = createApp();
    let testUser: any;
    let authToken: string;
    const testId = generateTestId();
    const alphaTestId = generateAlphanumericTestId();
    const testPassword = 'TestPassword123!';

    beforeAll(async () => {
        const hashedPassword = await hashPassword(testPassword);

        // Create test user
        const userResult = await query(
            `INSERT INTO users (username, email, password_hash, full_name, email_verified, account_status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, username, email`,
            [
                `testuser_${alphaTestId}`,
                `test_${testId}@example.com`,
                hashedPassword,
                `Test User ${testId}`,
                true,
                'active'
            ]
        );
        testUser = userResult.rows[0];
        authToken = generateTestToken(testUser.id);
    });

    afterAll(async () => {
        // Clean up
        if (testUser?.id) {
            await query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
    });

    describe('POST /api/profile/deactivate', () => {
        it('should deactivate account with correct password', async () => {
            const response = await request(app)
                .post('/api/profile/deactivate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ password: testPassword })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deactivated');

            // Verify account status changed
            const result = await query(
                'SELECT account_status FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('pending_deletion');

            // Reset status for other tests
            await query(
                'UPDATE users SET account_status = $1 WHERE id = $2',
                ['active', testUser.id]
            );
        });

        it('should reject incorrect password', async () => {
            const response = await request(app)
                .post('/api/profile/deactivate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ password: 'WrongPassword123!' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('password');
        });

        it('should require password', async () => {
            const response = await request(app)
                .post('/api/profile/deactivate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/profile/deactivate')
                .send({ password: testPassword })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token required');
        });
    });

    describe('POST /api/profile/request-deletion', () => {
        it('should create data deletion request', async () => {
            const response = await request(app)
                .post('/api/profile/request-deletion')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deletion request');

            // Verify account status
            const result = await query(
                'SELECT account_status FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('pending_deletion');

            // Reset
            await query(
                'UPDATE users SET account_status = $1 WHERE id = $2',
                ['active', testUser.id]
            );
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/profile/request-deletion')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
