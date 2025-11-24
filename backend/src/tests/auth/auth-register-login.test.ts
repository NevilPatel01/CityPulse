/**
 * Core Authentication Integration Tests
 * Tests for register, login, and logout endpoints
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import {
    createTestUser,
    deleteTestUser,
    generateTestId,
    generateAlphanumericTestId,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';

const app = createApp();

describe('Authentication - Register, Login, Logout', () => {
    const createdUserIds: number[] = [];

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

    describe('POST /api/auth/register', () => {
        it('should successfully register a new user with all fields', async () => {
            const testId = generateAlphanumericTestId();
            const emailId = generateTestId();
            const userRegistration = {
                username: testId,
                email: `newuser_${emailId}@example.com`,
                password: 'SecurePassword123!',
                fullName: 'New Test User',
                bio: 'Test user bio',
                currentLocation: 'Toronto, ON',
                hometown: 'Montreal, QC',
                phone: '+1234567890'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userRegistration)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('registered successfully');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(userRegistration.email);
            expect(response.body.data.user.username).toBe(userRegistration.username);
            expect(response.body.data.user.fullName).toBe(userRegistration.fullName);
            expect(response.body.data.user.role).toBe('user');
            expect(response.body.data.user.account_status).toBe('active');
            expect(response.body.data.user.email_verified).toBe(false);
            expect(response.body.data.user.password_hash).toBeUndefined();

            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();

            // Track for cleanup
            createdUserIds.push(response.body.data.user.id);
        });

        it('should register user with only required fields', async () => {
            const testId = generateAlphanumericTestId();
            const emailId = generateTestId();
            const minimalUser = {
                username: testId,
                email: `minimal_${emailId}@example.com`,
                password: 'MinimalPass123!',
                fullName: 'Minimal User'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(minimalUser)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.bio).toBeNull();
            expect(response.body.data.user.current_location).toBeNull();
            expect(response.body.data.user.hometown).toBeNull();
            expect(response.body.data.user.phone).toBeNull();

            createdUserIds.push(response.body.data.user.id);
        });

        it('should reject registration with existing email', async () => {
            const emailId = generateTestId();
            const email = `duplicate_${emailId}@example.com`;

            const user1 = {
                username: generateAlphanumericTestId(),
                email,
                password: 'Password123!',
                fullName: 'User One'
            };

            const user2 = {
                username: generateAlphanumericTestId(),
                email, // Same email
                password: 'Password123!',
                fullName: 'User Two'
            };

            // Register first user
            const firstResponse = await request(app)
                .post('/api/auth/register')
                .send(user1)
                .expect(201);

            createdUserIds.push(firstResponse.body.data.user.id);

            // Try to register second user with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(user2)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should reject registration with existing username', async () => {
            const username = generateAlphanumericTestId();
            const emailId1 = generateTestId();
            const emailId2 = generateTestId();

            const user1 = {
                username,
                email: `user1_${emailId1}@example.com`,
                password: 'Password123!',
                fullName: 'User One'
            };

            const user2 = {
                username, // Same username
                email: `user2_${emailId2}@example.com`,
                password: 'Password123!',
                fullName: 'User Two'
            };

            // Register first user
            const firstResponse = await request(app)
                .post('/api/auth/register')
                .send(user1)
                .expect(201);

            createdUserIds.push(firstResponse.body.data.user.id);

            // Try to register second user with same username
            const response = await request(app)
                .post('/api/auth/register')
                .send(user2)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should reject registration with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: generateAlphanumericTestId(),
                    email: 'invalid-email-format',
                    password: 'Password123!',
                    fullName: 'Test User'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should reject registration with weak password', async () => {
            const emailId = generateTestId();
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: generateAlphanumericTestId(),
                    email: `${emailId}@example.com`,
                    password: 'weak',
                    fullName: 'Test User'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should reject registration with missing required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    // Missing email, password, fullName
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser: any;

        beforeEach(async () => {
            // Create a test user for login tests
            testUser = await createTestUser({
                password: 'LoginPassword123!'
            });
            createdUserIds.push(testUser.id);
        });

        it('should successfully login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'LoginPassword123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.id).toBe(testUser.id);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.password_hash).toBeUndefined();
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
        });

        it('should reject login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should reject login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'SomePassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should reject login with invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'Password123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject login with missing password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject login with missing email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'Password123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({
                password: 'LogoutPassword123!'
            });
            createdUserIds.push(testUser.id);

            // Login to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'LogoutPassword123!'
                });

            accessToken = loginResponse.body.data.accessToken;
        });

        it('should successfully logout', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
        });

        it('should logout even without authorization header', async () => {
            // Logout should work even without token (client-side cleanup)
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});
