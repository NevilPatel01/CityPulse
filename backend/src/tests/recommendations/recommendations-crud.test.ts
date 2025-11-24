/**
 * Recommendations CRUD Integration Tests
 * Tests for recommendation endpoints (create, read, update, delete)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    deleteTestUser,
    generateTestId,
    generateAlphanumericTestId,
    generateTestToken,
    createTestRecommendation,
    createTestCity,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';

const app = createApp();

let testUser: any;
let authToken: string;
const createdUserIds: number[] = [];
const createdRecommendationIds: number[] = [];

beforeAll(async () => {
    testUser = await createTestUser();
    createdUserIds.push(testUser.id);
    authToken = generateTestToken(testUser.id);
});

beforeEach(async () => {
    // No per-test setup needed; using global testUser and authToken
});

afterEach(async () => {
    // Clean up recommendations first (foreign key constraints)
    for (const id of createdRecommendationIds) {
        try {
            await request(app)
                .delete(`/api/recommendations/${id}`)
                .set('Authorization', `Bearer ${authToken}`);
        } catch (error) {
            // Ignore errors (recommendation might already be deleted)
        }
    }
    createdRecommendationIds.length = 0;
});

afterAll(async () => {
    await cleanupAllTestData();
});

describe('Recommendations API', () => {

    describe('GET /api/recommendations', () => {
        it('should get all recommendations', async () => {
            const response = await request(app)
                .get('/api/recommendations')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should filter recommendations by category', async () => {
            const response = await request(app)
                .get('/api/recommendations?category=Restaurant')
                .expect(200);

            expect(response.body.success).toBe(true);
            const recommendations = response.body.data.recommendations;
            if (recommendations.length > 0) {
                recommendations.forEach((rec: any) => {
                    expect(rec.category_name).toBeDefined();
                });
            }
        });
    });

    it('should filter recommendations by city', async () => {
        const response = await request(app)
            .get('/api/recommendations?city=Toronto')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should paginate recommendations', async () => {
        const response = await request(app)
            .get('/api/recommendations?page=1&limit=5')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should sort recommendations by rating', async () => {
        const response = await request(app)
            .get('/api/recommendations?sortBy=rating\u0026order=desc')
            .expect(200);

        expect(response.body.success).toBe(true);
        const recommendations = response.body.data.recommendations;
        if (recommendations.length > 1) {
            // Ensure each recommendation has a numeric rating
            recommendations.forEach((rec: any) => {
                expect(typeof rec.user_rating).toBe('number');
            });
        }
    });
});

describe('GET /api/recommendations/categories', () => {
    it('should get all recommendation categories', async () => {
        const response = await request(app)
            .get('/api/recommendations/categories')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return categories with correct structure', async () => {
        const response = await request(app)
            .get('/api/recommendations/categories')
            .expect(200);

        const categories = response.body.data;
        if (categories.length > 0) {
            expect(categories[0]).toHaveProperty('id');
            expect(categories[0]).toHaveProperty('name');
        }
    });
});

describe('GET /api/recommendations/cities', () => {
    it('should get all cities with recommendations', async () => {
        const response = await request(app)
            .get('/api/recommendations/cities')
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return cities with recommendation counts', async () => {
        const response = await request(app)
            .get('/api/recommendations/cities')
            .expect(200);

        const cities = response.body.data;
        if (cities.length > 0) {
            expect(cities[0]).toHaveProperty('city_name');
            expect(cities[0]).toHaveProperty('recommendation_count');
        }
    });

    it('should filter cities by search query', async () => {
        const response = await request(app)
            .get('/api/recommendations/cities?search=toronto')
            .expect(200);

        expect(response.body.success).toBe(true);
        const cities = response.body.data;
        cities.forEach((city: any) => {
            expect(city.city_name.toLowerCase()).toContain('toronto');
        });
    });
});

describe('GET /api/recommendations/:id', () => {
    it('should get recommendation by ID', async () => {
        // First create a recommendation
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .get(`/api/recommendations/${recommendation.id}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(recommendation.id);
        expect(response.body.data.title).toBe(recommendation.title);
    });

    it('should return 404 for non-existent recommendation', async () => {
        const response = await request(app)
            .get('/api/recommendations/999999')
            .expect(404);

        expect(response.body.success).toBe(false);
    });

    it('should include user information in recommendation', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .get(`/api/recommendations/${recommendation.id}`)
            .expect(200);

        expect(response.body.data.username).toBeDefined();
        expect(response.body.data.username).toBe(testUser.username);
    });
});

describe('POST /api/recommendations', () => {
    it('should create new recommendation with valid data', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        const newRecommendation = {
            place_name: 'Amazing Restaurant',
            city_name: city.name,
            category_id: category.rows[0].id,
            description: 'Best food in town',
            user_rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newRecommendation)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBeDefined();

        createdRecommendationIds.push(response.body.data.id);
    });

    it('should create recommendation with minimal required fields', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        const minimalRecommendation = {
            place_name: 'Quick Spot',
            city_name: city.name,
            category_id: category.rows[0].id,
            user_rating: 4
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(minimalRecommendation)
            .expect(201);

        expect(response.body.success).toBe(true);
        createdRecommendationIds.push(response.body.data.id);
    });

    it('should reject recommendation without authentication', async () => {
        const city = await createTestCity();
        const newRecommendation = {
            cityId: city.id,
            title: 'Test Place',
            category: 'restaurant',
            rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .send(newRecommendation)
            .expect(401);

        expect(response.body.success).toBe(false);
    });

    it('should reject recommendation with invalid category', async () => {
        const city = await createTestCity();
        const invalidRecommendation = {
            cityId: city.id,
            title: 'Test Place',
            category: 'invalid_category',
            rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidRecommendation)
            .expect(400);

        expect(response.body.success).toBe(false);
    });

    it('should reject recommendation with invalid rating', async () => {
        const city = await createTestCity();
        const invalidRecommendation = {
            cityId: city.id,
            title: 'Test Place',
            category: 'restaurant',
            rating: 6 // Rating must be 1-5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidRecommendation)
            .expect(400);

        expect(response.body.success).toBe(false);
    });

    it('should reject recommendation with missing required fields', async () => {
        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Incomplete Data' })
            .expect(400);

        expect(response.body.success).toBe(false);
    });
});

describe('PUT /api/recommendations/:id', () => {
    it('should update own recommendation', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const updates = {
            place_name: 'Updated Title',
            description: 'Updated description',
            user_rating: 4,
            category_id: recommendation.category_id
        };

        const response = await request(app)
            .put(`/api/recommendations/${recommendation.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updates)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('updated');
    });

    it('should reject update without authentication', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .put(`/api/recommendations/${recommendation.id}`)
            .send({ title: 'Updated' })
            .expect(401);

        expect(response.body.success).toBe(false);
    });

    it('should reject update of another user recommendation', async () => {
        // Create another user
        const otherUser = await createTestUser();
        createdUserIds.push(otherUser.id);

        const city = await createTestCity();
        const recommendation = await createTestRecommendation(otherUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .put(`/api/recommendations/${recommendation.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Trying to update' })
            .expect(403);

        expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent recommendation', async () => {
        const response = await request(app)
            .put('/api/recommendations/999999')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Updated' })
            .expect(404);

        expect(response.body.success).toBe(false);
    });
});

describe('DELETE /api/recommendations/:id', () => {
    it('should delete own recommendation', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .delete(`/api/recommendations/${recommendation.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);

        // Verify it's deleted
        const getResponse = await request(app)
            .get(`/api/recommendations/${recommendation.id}`)
            .expect(404);

        expect(getResponse.body.success).toBe(false);
    });

    it('should reject delete without authentication', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .delete(`/api/recommendations/${recommendation.id}`)
            .expect(401);

        expect(response.body.success).toBe(false);
    });

    it('should reject delete of another user recommendation', async () => {
        const otherUser = await createTestUser();
        createdUserIds.push(otherUser.id);

        const city = await createTestCity();
        const recommendation = await createTestRecommendation(otherUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .delete(`/api/recommendations/${recommendation.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(403);

        expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent recommendation', async () => {
        const response = await request(app)
            .delete('/api/recommendations/999999')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(404);

        expect(response.body.success).toBe(false);
    });
});

describe('POST /api/recommendations/:id/photos', () => {
    it('should reject photo upload without authentication', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .post(`/api/recommendations/${recommendation.id}/photos`)
            .expect(401);

        expect(response.body.success).toBe(false);
    });

    it('should reject photo upload for non-existent recommendation', async () => {
        const response = await request(app)
            .post('/api/recommendations/999999/photos')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(404);

        expect(response.body.success).toBe(false);
    });

    it('should reject photo upload for another user recommendation', async () => {
        const otherUser = await createTestUser();
        createdUserIds.push(otherUser.id);

        const city = await createTestCity();
        const recommendation = await createTestRecommendation(otherUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .post(`/api/recommendations/${recommendation.id}/photos`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(403);

        expect(response.body.success).toBe(false);
    });

    // Note: Actual file upload tests would require multipart/form-data
    // and mock files, which can be added if needed
});

