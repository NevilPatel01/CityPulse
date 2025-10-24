/**
 * Search API Integration Tests
 * Tests for all search endpoints
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import {
    createTestUser,
    deleteTestUser,
    createTestRecommendation,
    createTestCity,
    cleanupAllTestData,
    generateTestToken
} from '../helpers/test-helpers';

const app = createApp();

describe('Search API', () => {
    const createdUserIds: number[] = [];
    const createdRecommendationIds: number[] = [];
    const createdCityIds: number[] = [];
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
        // Create test user and get auth token for all search tests
        testUser = await createTestUser();
        createdUserIds.push(testUser.id);
        authToken = generateTestToken(testUser.id);
    });

    afterEach(async () => {
        // Clean up in reverse order of dependencies
        for (const userId of createdUserIds) {
            await deleteTestUser(userId);
        }
        createdUserIds.length = 0;
        createdRecommendationIds.length = 0;
        createdCityIds.length = 0;
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('GET /api/search', () => {
        it('should search across all entities', async () => {
            const response = await request(app)
                .get('/api/search?q=test')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('users');
            expect(response.body.data).toHaveProperty('recommendations');
            expect(response.body.data).toHaveProperty('cities');
            expect(Array.isArray(response.body.data.users)).toBe(true);
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
            expect(Array.isArray(response.body.data.cities)).toBe(true);
        });

        it('should return empty results for non-matching query', async () => {
            const response = await request(app)
                .get('/api/search?q=xyznonexistent12345')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.length).toBe(0);
            expect(response.body.data.recommendations.length).toBe(0);
            expect(response.body.data.cities.length).toBe(0);
        });

        it('should reject search with missing query parameter', async () => {
            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject search with empty query', async () => {
            const response = await request(app)
                .get('/api/search?q=')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should limit results per entity type', async () => {
            const response = await request(app)
                .get('/api/search?q=test&limit=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.length).toBeLessThanOrEqual(5);
            expect(response.body.data.recommendations.length).toBeLessThanOrEqual(5);
            expect(response.body.data.cities.length).toBeLessThanOrEqual(5);
        });
    });

    describe('GET /api/search/recommendations', () => {
        it('should search recommendations by query', async () => {
            const response = await request(app)
                .get('/api/search/recommendations?q=restaurant')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
        });

        it('should filter recommendations by category', async () => {
            const response = await request(app)
                .get('/api/search/recommendations?q=place&category=restaurant')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const recommendations = response.body.data.recommendations;
            recommendations.forEach((rec: any) => {
                if (rec.category) {
                    expect(rec.category).toBe('restaurant');
                }
            });
        });

        it('should filter recommendations by city', async () => {
            const response = await request(app)
                .get('/api/search/recommendations?q=place&city=Toronto')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
        });

        it('should paginate recommendation search results', async () => {
            const response = await request(app)
                .get('/api/search/recommendations?q=test&page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.recommendations.length).toBeLessThanOrEqual(10);
        });

        it('should reject search without query parameter', async () => {
            const response = await request(app)
                .get('/api/search/recommendations')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/search/users', () => {
        beforeEach(async () => {
            // Create test users with searchable data
            const user1 = await createTestUser({
                fullName: 'John Traveler',
                bio: 'Love exploring new cities'
            });
            createdUserIds.push(user1.id);

            const user2 = await createTestUser({
                fullName: 'Jane Explorer',
                bio: 'Adventure seeker'
            });
            createdUserIds.push(user2.id);
        });

        it('should search users by username or name', async () => {
            const response = await request(app)
                .get('/api/search/users?q=test')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.users)).toBe(true);
        });

        it('should search users by bio', async () => {
            const response = await request(app)
                .get('/api/search/users?q=explorer')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const users = response.body.data.users;
            expect(users.length).toBeGreaterThan(0);
        });

        it('should paginate user search results', async () => {
            const response = await request(app)
                .get('/api/search/users?q=test&page=1&limit=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.length).toBeLessThanOrEqual(5);
        });

        it('should not return sensitive user data', async () => {
            const response = await request(app)
                .get('/api/search/users?q=test')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const users = response.body.data.users;
            users.forEach((user: any) => {
                expect(user).not.toHaveProperty('password_hash');
                expect(user).not.toHaveProperty('email');
            });
        });

        it('should reject search without query parameter', async () => {
            const response = await request(app)
                .get('/api/search/users')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/search/cities', () => {
        it('should search cities by name', async () => {
            const response = await request(app)
                .get('/api/search/cities?q=toronto')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.cities)).toBe(true);
        });

        it('should search cities by country', async () => {
            const response = await request(app)
                .get('/api/search/cities?q=canada')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.cities)).toBe(true);
        });

        it('should include recommendation count for cities', async () => {
            const response = await request(app)
                .get('/api/search/cities?q=test')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const cities = response.body.data.cities;
            cities.forEach((city: any) => {
                expect(city).toHaveProperty('name');
                expect(city).toHaveProperty('recommendation_count');
                expect(typeof city.recommendation_count).toBe('number');
            });
        });

        it('should paginate city search results', async () => {
            const response = await request(app)
                .get('/api/search/cities?q=test&page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.cities.length).toBeLessThanOrEqual(10);
        });

        it('should reject search without query parameter', async () => {
            const response = await request(app)
                .get('/api/search/cities')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should return empty array for non-matching city search', async () => {
            const response = await request(app)
                .get('/api/search/cities?q=nonexistentcity12345xyz')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.cities).toEqual([]);
        });
    });

    describe('Search Performance', () => {
        it('should complete search within acceptable time', async () => {
            const startTime = Date.now();

            await request(app)
                .get('/api/search?q=test')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Search should complete in less than 2 seconds
            expect(duration).toBeLessThan(2000);
        });

        it('should handle special characters in search query', async () => {
            const specialChars = ['@', '#', '$', '%', '&'];

            for (const char of specialChars) {
                const response = await request(app)
                    .get(`/api/search?q=test${char}`)
                .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
            }
        });

        it('should handle long search queries', async () => {
            const longQuery = 'a'.repeat(100);

            const response = await request(app)
                .get(`/api/search?q=${longQuery}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});
