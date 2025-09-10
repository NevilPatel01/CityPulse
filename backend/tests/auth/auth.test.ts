import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { prisma, cleanupDatabase } from '../setup';

describe('Authentication API', () => {
    let app: Express;
    let server: any;

    beforeAll(async () => {
        app = createApp();
        server = app.listen(0); // It uses random available port for testing
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
    });

    beforeEach(async () => {
        await cleanupDatabase();
    });

    describe('POST /api/auth/register', () => {
        const validUserData = {
            username: 'testuser123',
            email: 'test@example.com',
            password: 'TestPassword123!',
            fullName: 'Test User',
            bio: 'Test bio',
            currentLocation: 'Toronto, Canada'
        };

        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data.user).toMatchObject({
                username: validUserData.username,
                email: validUserData.email,
                fullName: validUserData.fullName,
                role: 'user',
                accountStatus: 'active',
                emailVerified: false
            });
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should return validation errors for invalid data', async () => {
            const invalidData = {
                username: 'ab', // Too short
                email: 'invalid-email', // Invalid format
                password: 'weak', // Too weak
                fullName: 'A' // Too short
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toHaveLength(5); // 5 validation errors
        });

        it('should reject duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(201);

            // Attempt duplicate registration
            const duplicateData = {
                ...validUserData,
                username: 'differentuser'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User with this email already exists');
        });

        it('should reject duplicate username', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send(validUserData)
                .expect(201);

            // Attempt duplicate username
            const duplicateData = {
                ...validUserData,
                email: 'different@example.com'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User with this username already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        const userData = {
            username: 'logintest',
            email: 'login@example.com',
            password: 'LoginPassword123!',
            fullName: 'Login Test User'
        };

        beforeEach(async () => {
            // Create a user for login tests
            await request(app)
                .post('/api/auth/register')
                .send(userData);
        });

        it('should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should reject invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: userData.password
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: 'WrongPassword123!'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should return validation errors for invalid input', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: ''
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toHaveLength(2);
        });
    });

    describe('GET /api/auth/profile', () => {
        let accessToken: string;
        const userData = {
            username: 'profiletest',
            email: 'profile@example.com',
            password: 'ProfilePassword123!',
            fullName: 'Profile Test User'
        };

        beforeEach(async () => {
            // Register and get access token
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(userData);

            accessToken = registerResponse.body.data.accessToken;
        });

        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.username).toBe(userData.username);
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid or expired token');
        });
    });

    describe('POST /api/auth/logout', () => {
        let accessToken: string;
        const userData = {
            username: 'logouttest',
            email: 'logout@example.com',
            password: 'LogoutPassword123!',
            fullName: 'Logout Test User'
        };

        beforeEach(async () => {
            // Register and get access token
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(userData);

            accessToken = registerResponse.body.data.accessToken;
        });

        it('should logout successfully with valid token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
        });

        it('should reject logout without token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token is required');
        });
    });

    describe('POST /api/auth/change-password', () => {
        let accessToken: string;
        const userData = {
            username: 'changepasstest',
            email: 'changepass@example.com',
            password: 'OldPassword123!',
            fullName: 'Change Password Test User'
        };

        beforeEach(async () => {
            // Register and get access token
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send(userData);

            accessToken = registerResponse.body.data.accessToken;
        });

        it('should change password successfully', async () => {
            const response = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: userData.password,
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password changed successfully');
        });

        it('should reject with wrong current password', async () => {
            const response = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'WrongPassword123!',
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Current password is incorrect');
        });

        it('should reject when passwords do not match', async () => {
            const response = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: userData.password,
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'DifferentPassword123!'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });
    });
});
