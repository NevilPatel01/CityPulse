import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { query } from '../../lib/database';
import { createApp } from '../../app';
import { createTestUser } from '../setup';

describe('Account Reactivation Tests', () => {
    const app = createApp();
    let testUser: any;
    let authToken: string;
    const testPassword = 'TestPassword123!';

    beforeAll(async () => {
        // Create test user with email verified
        testUser = await createTestUser({
            password: testPassword,
            emailVerified: true
        });

        // Login to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testPassword
            });

        authToken = loginResponse.body.data.accessToken;
    });

    afterAll(async () => {
        // Cleanup
        if (testUser?.id) {
            await query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
    });

    describe('Account Deactivation', () => {
        it('should deactivate account with correct password', async () => {
            const response = await request(app)
                .post('/api/profile/deactivate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ password: testPassword })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deactivated');

            // Verify account status changed and deactivated_at is set
            const result = await query(
                'SELECT account_status, deactivated_at FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('pending_deletion');
            expect(result.rows[0].deactivated_at).not.toBeNull();
        });

        it('should reject deactivation with incorrect password', async () => {
            // First, reactivate the account
            await query(
                `UPDATE users 
                    SET account_status = 'active', deactivated_at = NULL 
                    WHERE id = $1`,
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/profile/deactivate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ password: 'WrongPassword123!' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('password');
        });

        it('should require password for deactivation', async () => {
            const response = await request(app)
                .post('/api/profile/deactivate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Password is required');
        });
    });

    describe('Account Reactivation Within 30 Days', () => {
        beforeEach(async () => {
            // Deactivate account for each test
            await query(
                `UPDATE users 
                 SET account_status = 'pending_deletion', 
                     deactivated_at = NOW() 
                 WHERE id = $1`,
                [testUser.id]
            );
        });

        it('should reactivate deactivated account on login within 30 days', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testPassword
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.accessToken).toBeDefined();

            // Verify account was reactivated
            const result = await query(
                'SELECT account_status, deactivated_at FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('active');
            expect(result.rows[0].deactivated_at).toBeNull();
        });

        it('should reactivate account within 30 days (test with 29 days)', async () => {
            // Set deactivation to 29 days ago
            await query(
                `UPDATE users 
                    SET deactivated_at = NOW() - INTERVAL '29 days' 
                    WHERE id = $1`,
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testPassword
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify account was reactivated
            const result = await query(
                'SELECT account_status, deactivated_at FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('active');
            expect(result.rows[0].deactivated_at).toBeNull();
        });

        it('should reactivate account on the 30th day', async () => {
            // Set deactivation to exactly 30 days ago
            await query(
                `UPDATE users 
                 SET deactivated_at = NOW() - INTERVAL '30 days' 
                 WHERE id = $1`,
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testPassword
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify account was reactivated
            const result = await query(
                'SELECT account_status FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('active');
        });
    });

    describe('Account Deletion After 30 Days', () => {
        it('should reject login after 30 days with appropriate message', async () => {
            // Set deactivation to 31 days ago
            await query(
                `UPDATE users 
                 SET account_status = 'pending_deletion',
                     deactivated_at = NOW() - INTERVAL '31 days' 
                 WHERE id = $1`,
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testPassword
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('permanently deleted');
            expect(response.body.message).toContain('30-day reactivation period has expired');
            expect(response.body.code).toBe('ACCOUNT_EXPIRED');

            // Verify account status is still pending_deletion
            const result = await query(
                'SELECT account_status FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('pending_deletion');
        });

        it('should reject login after 60 days', async () => {
            // Set deactivation to 60 days ago
            await query(
                `UPDATE users 
                 SET account_status = 'pending_deletion',
                     deactivated_at = NOW() - INTERVAL '60 days' 
                 WHERE id = $1`,
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testPassword
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ACCOUNT_EXPIRED');
        });
    });

    describe('Google OAuth Reactivation', () => {
        let googleUser: any;
        let googleAuthToken: string;
        const googleEmail = `google_reactivation_${Date.now()}@test.com`;
        const googleId = `google_${Date.now()}`;

        beforeAll(async () => {
            // Create a Google OAuth user
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    googleId: googleId,
                    email: googleEmail,
                    name: 'Google Reactivation Test',
                    picture: 'https://example.com/photo.jpg'
                });

            googleUser = response.body.data.user;
            googleAuthToken = response.body.data.accessToken;
        });

        afterAll(async () => {
            // Cleanup
            if (googleUser?.id) {
                await query('DELETE FROM users WHERE id = $1', [googleUser.id]);
            }
        });

        it('should reactivate Google OAuth account within 30 days', async () => {
            // Deactivate the account
            await query(
                `UPDATE users 
                 SET account_status = 'pending_deletion', 
                     deactivated_at = NOW() - INTERVAL '10 days'
                 WHERE id = $1`,
                [googleUser.id]
            );

            // Try to login via Google OAuth
            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    googleId: googleId,
                    email: googleEmail,
                    name: 'Google Reactivation Test',
                    picture: 'https://example.com/photo.jpg'
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify account was reactivated
            const result = await query(
                'SELECT account_status, deactivated_at FROM users WHERE id = $1',
                [googleUser.id]
            );
            expect(result.rows[0].account_status).toBe('active');
            expect(result.rows[0].deactivated_at).toBeNull();
        });

        it('should reject Google OAuth login after 30 days', async () => {
            // Set deactivation to 31 days ago
            await query(
                `UPDATE users 
                 SET account_status = 'pending_deletion',
                     deactivated_at = NOW() - INTERVAL '31 days'
                 WHERE id = $1`,
                [googleUser.id]
            );

            const response = await request(app)
                .post('/api/auth/google')
                .send({
                    googleId: googleId,
                    email: googleEmail,
                    name: 'Google Reactivation Test',
                    picture: 'https://example.com/photo.jpg'
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('permanently deleted');
            expect(response.body.code).toBe('ACCOUNT_EXPIRED');
        });
    });

    describe('Suspended vs Deactivated Accounts', () => {
        it('should reject suspended accounts without reactivation option', async () => {
            // Suspend the account (without deactivated_at)
            await query(
                `UPDATE users 
                 SET account_status = 'suspended', 
                     deactivated_at = NULL 
                 WHERE id = $1`,
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testPassword
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('suspended or banned');
            expect(response.body.code).toBe('ACCOUNT_SUSPENDED');

            // Verify account is still suspended
            const result = await query(
                'SELECT account_status FROM users WHERE id = $1',
                [testUser.id]
            );
            expect(result.rows[0].account_status).toBe('suspended');
        });

        it('should reject banned accounts', async () => {
            // Ban the account
            await query(
                `UPDATE users 
                 SET account_status = 'banned', 
                     deactivated_at = NULL 
                 WHERE id = $1`,
                [testUser.id]
            );

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testPassword
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ACCOUNT_SUSPENDED');
        });
    });
});

