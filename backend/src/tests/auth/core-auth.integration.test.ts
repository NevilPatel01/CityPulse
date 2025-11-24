import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { cleanupDatabase } from '../setup';
import { generateTestId, generateAlphanumericTestId, deleteTestUser, cleanupAllTestData } from '../helpers/test-helpers';

const app = createApp();

describe('Core Authentication Integration Tests', () => {
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

    describe('POST /api/auth/register', () => {
        it('should successfully register a new user with valid data', async () => {
            const testId = generateAlphanumericTestId();
            const emailId = generateTestId();
            const userRegistration = {
                username: testId,
                email: `newuser_${emailId}@example.com`,
                password: 'Secure4Password123!',
                fullName: 'New User',
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
            expect(response.body.data.user.password_hash).toBeUndefined(); // Should not be returned

            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            // Check that cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();

            createdUserIds.push(response.body.data.user.id);
        });

        it('should register user with minimal required fields', async () => {
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
            const testEmail = `duplicate_${emailId}@example.com`;
            const user1 = {
                username: generateAlphanumericTestId(),
                email: testEmail,
                password: 'Password123!',
                fullName: 'User One'
            };

            const user2 = {
                username: generateAlphanumericTestId(),
                email: testEmail, // Same email
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
            expect(response.body.message).toBe('User with this email already exists');
        });

        it('should reject registration with existing username', async () => {
            const testUsername = generateAlphanumericTestId();
            const user1 = {
                username: testUsername,
                email: `user1_${generateTestId()}@example.com`,
                password: 'Password123!',
                fullName: 'User One'
            };

            const user2 = {
                username: testUsername, // Same username
                email: `user2_${generateTestId()}@example.com`,
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
            expect(response.body.message).toBe('User with this username already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        let testUser: any;

        beforeEach(async () => {
            // Create a unique test user for each login test
            const testId = generateAlphanumericTestId();
            const emailId = generateTestId();
            testUser = {
                username: testId,
                email: `login_${emailId}@example.com`,
                password: 'MinimalPass123!',
                fullName: 'Minimal User'
            };

            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            createdUserIds.push(registerResponse.body.data.user.id);
        });

        it('should successfully login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.password_hash).toBeUndefined();
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            // Check that cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
        });

        it('should reject login with wrong password', async () => {
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
                    password: 'SomePassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject login with missing credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should successfully logout user', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');

            // Check that cookies are cleared
            const cookies = response.headers['set-cookie'];
            if (cookies && Array.isArray(cookies)) {
                expect(cookies.some((cookie: string) =>
                    cookie.includes('accessToken=;') || cookie.includes('refreshToken=;')
                )).toBe(true);
            }
        });

        it('should logout even when not authenticated', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
        });
    });

    describe('GET /api/auth/profile', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            // Create a unique test user for each profile test
            const testId = generateAlphanumericTestId();
            const emailId = generateTestId();
            testUser = {
                username: testId,
                email: `profile_${emailId}@example.com`,
                password: 'ProfilePassword123!',
                fullName: 'Profile Test User'
            };

            // Create and login a test user
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            accessToken = registerResponse.body.data?.accessToken;
            if (registerResponse.body.data?.user?.id) {
                createdUserIds.push(registerResponse.body.data.user.id);
            }
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Cookie', `accessToken=${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.username).toBe(testUser.username);
            expect(response.body.data.user.password_hash).toBeUndefined(); // Should not return password
        });

        it('should reject profile request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token required');
        });

        it('should reject profile request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Cookie', 'accessToken=invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired token');
        });
    });

    describe('PUT /api/auth/change-password', () => {
        let testUser: any;
        let accessToken: string;

        beforeEach(async () => {
            // Create a unique test user for each password change test
            const testId = generateAlphanumericTestId();
            const emailId = generateTestId();
            testUser = {
                username: testId,
                email: `changepass_${emailId}@example.com`,
                password: 'OldPassword123!',
                fullName: 'Change Password User'
            };

            // Create and login a test user
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            accessToken = registerResponse.body.data?.accessToken;
            if (registerResponse.body.data?.user?.id) {
                createdUserIds.push(registerResponse.body.data.user.id);
            }
        });

        it('should successfully change password with valid data', async () => {
            const newPassword = 'NewPassword123!';
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Cookie', `accessToken=${accessToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: newPassword,
                    confirmPassword: newPassword
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password changed successfully');

            // Verify old password no longer works
            const oldLoginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(401);

            expect(oldLoginResponse.body.success).toBe(false);

            // Verify new password works
            const newLoginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'NewPassword123!'
                })
                .expect(200);

            expect(newLoginResponse.body.success).toBe(true);
        });

        it('should reject password change with wrong current password', async () => {
            const newPassword = 'NewPassword123!';
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Cookie', `accessToken=${accessToken}`)
                .send({
                    currentPassword: 'WrongPassword123!',
                    newPassword: newPassword,
                    confirmPassword: newPassword
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Current password is incorrect');
        });

        it('should reject password change with weak new password', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Cookie', `accessToken=${accessToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'weak',
                    confirmPassword: 'weak'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject password change without authentication', async () => {
            const newPassword = 'NewPassword123!';
            const response = await request(app)
                .put('/api/auth/change-password')
                .send({
                    currentPassword: testUser.password,
                    newPassword: newPassword,
                    confirmPassword: newPassword
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token required');
        });

        it('should reject password change with missing fields', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Cookie', `accessToken=${accessToken}`)
                .send({
                    currentPassword: testUser.password
                    // Missing newPassword
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Authentication Flow Integration', () => {
        it('should complete full registration -> login -> profile -> logout flow', async () => {
            const testId = generateAlphanumericTestId();
            const emailId = generateTestId();
            const testUser = {
                username: testId,
                email: `flow_${emailId}@example.com`,
                password: 'FlowPassword123!',
                fullName: 'Flow Test User'
            };

            // 1. Register
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(registerResponse.body.success).toBe(true);
            createdUserIds.push(registerResponse.body.data.user.id);

            // 2. Login (to test separate login after registration)
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
            const accessToken = loginResponse.body.data.accessToken;

            // 3. Get Profile
            const profileResponse = await request(app)
                .get('/api/auth/profile')
                .set('Cookie', `accessToken=${accessToken}`)
                .expect(200);

            expect(profileResponse.body.success).toBe(true);
            expect(profileResponse.body.data.user.email).toBe(testUser.email);

            // 4. Logout
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            expect(logoutResponse.body.success).toBe(true);

            // 5. Note: JWT tokens remain valid until expiration even after logout
            // The logout endpoint clears cookies client-side but doesn't invalidate the token server-side
            // This is normal JWT behavior. To truly invalidate, we'd need token blacklisting
        });

        it('should handle concurrent registrations properly', async () => {
            const baseId = generateTestId();
            const users = [
                { username: generateAlphanumericTestId(), email: `concurrent1_${baseId}@example.com`, password: 'Pass123!', fullName: 'User 1' },
                { username: generateAlphanumericTestId(), email: `concurrent2_${baseId}@example.com`, password: 'Pass123!', fullName: 'User 2' },
                { username: generateAlphanumericTestId(), email: `concurrent3_${baseId}@example.com`, password: 'Pass123!', fullName: 'User 3' }
            ];

            const registrationPromises = users.map(user =>
                request(app).post('/api/auth/register').send(user)
            );

            const responses = await Promise.all(registrationPromises);

            // Track created users for cleanup
            responses.forEach(response => {
                if (response.body.data?.user?.id) {
                    createdUserIds.push(response.body.data.user.id);
                }
            });

            // All registrations should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            });

            // All users should have unique IDs
            const userIds = responses.map(res => res.body.data.user.id);
            const uniqueIds = [...new Set(userIds)];
            expect(uniqueIds.length).toBe(users.length);
        });
    });
});
