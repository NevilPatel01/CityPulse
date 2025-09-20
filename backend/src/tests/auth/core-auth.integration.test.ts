import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { cleanupDatabase } from '../setup';

const app = createApp();

describe('Core Authentication Integration Tests', () => {
    beforeEach(async () => {
        await cleanupDatabase();
    });

    afterAll(async () => {
        // Cleanup after all tests
    });

    describe('POST /api/auth/register', () => {
        it('should successfully register a new user with valid data', async () => {
            const userRegistration = {
                username: 'newuser4',
                email: 'newuser4@example.com',
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
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(userRegistration.email);
            expect(response.body.data.user.username).toBe(userRegistration.username);
            expect(response.body.data.user.full_name).toBe(userRegistration.fullName);
            expect(response.body.data.user.role).toBe('user');
            expect(response.body.data.user.account_status).toBe('active');
            expect(response.body.data.user.email_verified).toBe(false);
            expect(response.body.data.user.password_hash).toBeUndefined(); // Should not be returned

            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();

            // Check that cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
        });

        it('should register user with minimal required fields', async () => {
            const minimalUser = {
                username: 'minimaluser4',
                email: 'minimal4@example.com',
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
        });

        it('should reject registration with existing email', async () => {
            const user1 = {
                username: 'user6',
                email: 'duplicate6@example.com',
                password: 'Password123!',
                fullName: 'User One'
            };

            const user2 = {
                username: 'user6',
                email: 'duplicate6@example.com', // Same email
                password: 'Password123!',
                fullName: 'User Two'
            };

            // Register first user
            await request(app)
                .post('/api/auth/register')
                .send(user1)
                .expect(201);

            // Try to register second user with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(user2)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User with this email already exists');
        });

        it('should reject registration with existing username', async () => {
            const user1 = {
                username: 'duplicateuser4',
                email: 'user1@example.com',
                password: 'Password123!',
                fullName: 'User One'
            };

            const user2 = {
                username: 'duplicateuser4', // Same username
                email: 'user2@example.com',
                password: 'Password123!',
                fullName: 'User Two'
            };

            // Register first user
            await request(app)
                .post('/api/auth/register')
                .send(user1)
                .expect(201);

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
        const testUser = {
            username: 'minimaluser4',
            email: 'minimal4@example.com',
            password: 'MinimalPass123!',
            fullName: 'Minimal User'
        };

        beforeEach(async () => {
            // Create a test user for login tests
            await request(app)
                .post('/api/auth/register')
                .send(testUser);
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
        const testUser = {
            username: 'profileuser',
            email: 'profile@example.com',
            password: 'ProfilePassword123!',
            fullName: 'Profile Test User'
        };

        let accessToken: string;

        beforeEach(async () => {
            // Create and login a test user
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            accessToken = registerResponse.body.data.accessToken;
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
            expect(response.body.message).toBe('Authentication required');
        });

        it('should reject profile request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Cookie', 'accessToken=invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Authentication required');
        });
    });

    describe('PUT /api/auth/change-password', () => {
        const testUser = {
            username: 'changepassuser',
            email: 'changepass@example.com',
            password: 'OldPassword123!',
            fullName: 'Change Password User'
        };

        let accessToken: string;

        beforeEach(async () => {
            // Create and login a test user
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            accessToken = registerResponse.body.data.accessToken;
        });

        it('should successfully change password with valid data', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Cookie', `accessToken=${accessToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'NewPassword123!'
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
            const response = await request(app)
                .put('/api/auth/change-password')
                .set('Cookie', `accessToken=${accessToken}`)
                .send({
                    currentPassword: 'WrongCurrentPassword123!',
                    newPassword: 'NewPassword123!'
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
                    newPassword: 'weak'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject password change without authentication', async () => {
            const response = await request(app)
                .put('/api/auth/change-password')
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'NewPassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Authentication required');
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
            const testUser = {
                username: 'flowuser',
                email: 'flow@example.com',
                password: 'FlowPassword123!',
                fullName: 'Flow Test User'
            };

            // 1. Register
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(registerResponse.body.success).toBe(true);

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

            // 5. Verify profile is no longer accessible with old token
            await request(app)
                .get('/api/auth/profile')
                .set('Cookie', `accessToken=${accessToken}`)
                .expect(401);
        });

        it('should handle concurrent registrations properly', async () => {
            const users = [
                { username: 'concurrent1', email: 'concurrent1@example.com', password: 'Pass123!', fullName: 'User 1' },
                { username: 'concurrent2', email: 'concurrent2@example.com', password: 'Pass123!', fullName: 'User 2' },
                { username: 'concurrent3', email: 'concurrent3@example.com', password: 'Pass123!', fullName: 'User 3' }
            ];

            const registrationPromises = users.map(user => 
                request(app).post('/api/auth/register').send(user)
            );

            const responses = await Promise.all(registrationPromises);

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
