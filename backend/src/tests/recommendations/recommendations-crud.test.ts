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

    it('should upload photos for own recommendation', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        const newRecommendation = {
            place_name: 'Photo Test Place',
            city_name: city.name,
            category_id: category.rows[0].id,
            description: 'Testing photo upload',
            user_rating: 5
        };

        const createResponse = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newRecommendation)
            .expect(201);

        const recommendationId = createResponse.body.data.id;
        createdRecommendationIds.push(recommendationId);

        // Create a mock image buffer
        const mockImage = Buffer.from('fake-image-data');
        
        const uploadResponse = await request(app)
            .post(`/api/recommendations/${recommendationId}/photos`)
            .set('Authorization', `Bearer ${authToken}`)
            .attach('photos', mockImage, 'test-image.jpg')
            .expect(201);

        expect(uploadResponse.body.success).toBe(true);
        expect(uploadResponse.body.data.photos).toBeDefined();
    });

    it('should reject photo upload with invalid file type', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const mockFile = Buffer.from('fake-file-data');
        
        const response = await request(app)
            .post(`/api/recommendations/${recommendation.id}/photos`)
            .set('Authorization', `Bearer ${authToken}`)
            .attach('photos', mockFile, 'test-file.txt')
            .expect(400);

        expect(response.body.success).toBe(false);
    });
});

describe('GET /api/search/recommendations', () => {
    it('should search recommendations with valid query', async () => {
        const city = await createTestCity();
        const recommendation = await createTestRecommendation(testUser.id, city.id);
        createdRecommendationIds.push(recommendation.id);

        const response = await request(app)
            .get(`/api/search/recommendations?q=${encodeURIComponent(recommendation.title)}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });

    it('should reject search with empty query', async () => {
        const response = await request(app)
            .get('/api/search/recommendations?q=')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(400);

        expect(response.body.success).toBe(false);
    });

    it('should handle special characters in search query', async () => {
        const response = await request(app)
            .get('/api/search/recommendations?q=test%26special%3C%3E')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
    });

    it('should prevent SQL injection in search query', async () => {
        const maliciousQuery = "'; DROP TABLE users; --";
        
        const response = await request(app)
            .get(`/api/search/recommendations?q=${encodeURIComponent(maliciousQuery)}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        // Verify database still works
        const verifyResponse = await request(app)
            .get('/api/recommendations')
            .expect(200);
        expect(verifyResponse.body.success).toBe(true);
    });

    it('should filter search results by category', async () => {
        const city = await createTestCity();
        const category = await query('SELECT name FROM recommendation_categories LIMIT 1');
        const response = await request(app)
            .get(`/api/search/recommendations?q=test&category=${category.rows[0].name}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
    });

    it('should filter search results by city', async () => {
        const city = await createTestCity();
        const response = await request(app)
            .get(`/api/search/recommendations?q=test&city=${city.name}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
    });
});

describe('POST /api/recommendations - Test-to-Pass Values', () => {
    it('should create recommendation with all fields from proposal', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories WHERE id = 2 OR id = (SELECT id FROM recommendation_categories LIMIT 1) LIMIT 1');
        
        const proposalValidData = {
            place_name: 'Amazing CN Tower',
            description: 'Must-visit Toronto landmark',
            category_id: category.rows[0].id,
            price_range_min: 35.00,
            price_range_max: 50.00,
            difficulty_level: 'easy',
            address: '290 Bremner Blvd, Toronto',
            city_name: city.name,
            user_rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(proposalValidData)
            .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.title).toBe('Amazing CN Tower');
        expect(response.body.data.price_range_min).toBe(35.00);
        expect(response.body.data.price_range_max).toBe(50.00);

        createdRecommendationIds.push(response.body.data.id);
    });
});

describe('POST /api/recommendations - Test-to-Fail Values', () => {
    it('should reject recommendation with missing title (missing required field)', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        
        const invalidData = {
            description: 'Test description without title',
            category_id: category.rows[0].id,
            city_name: city.name
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData)
            .expect(400);

        expect(response.body.success).toBe(false);
    });

    it('should reject recommendation with invalid category_id (999)', async () => {
        const city = await createTestCity();
        
        const invalidData = {
            place_name: 'Test Place',
            description: 'Test description',
            category_id: 999,
            city_name: city.name,
            user_rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData)
            .expect(400);

        expect(response.body.success).toBe(false);
    });

    it('should reject recommendation with negative price', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        
        const invalidData = {
            place_name: 'Test Place',
            description: 'Test description',
            category_id: category.rows[0].id,
            price_range_min: -10,
            city_name: city.name,
            user_rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(invalidData)
            .expect(400);

        expect(response.body.success).toBe(false);
    });

    it('should sanitize XSS attempt in title', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        
        const xssData = {
            place_name: "<script>alert('xss')</script>",
            description: 'Test description',
            category_id: category.rows[0].id,
            city_name: city.name,
            user_rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(xssData)
            .expect(201);

        expect(response.body.success).toBe(true);
        // Verify XSS was sanitized
        expect(response.body.data.title).not.toContain('<script>');
        expect(response.body.data.title).not.toContain('alert');

        createdRecommendationIds.push(response.body.data.id);
    });

    it('should sanitize XSS attempt in description', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        
        const xssData = {
            place_name: 'Test Place',
            description: "<img src='x' onerror=\"alert('xss')\">",
            category_id: category.rows[0].id,
            city_name: city.name,
            user_rating: 5
        };

        const response = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(xssData)
            .expect(201);

        expect(response.body.success).toBe(true);
        // Verify XSS was sanitized
        const description = response.body.data.description;
        expect(description).not.toContain('<img');
        expect(description).not.toContain('onerror');

        createdRecommendationIds.push(response.body.data.id);
    });
});

describe('GET /api/recommendations/:id - Private Content Access', () => {
    it('should allow owner to access private recommendation', async () => {
        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        
        const privateRecommendation = {
            place_name: 'Private Place',
            description: 'Private description',
            category_id: category.rows[0].id,
            city_name: city.name,
            user_rating: 5,
            visibility: 'private'
        };

        const createResponse = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(privateRecommendation)
            .expect(201);

        const recommendationId = createResponse.body.data.id;
        createdRecommendationIds.push(recommendationId);

        // Owner should be able to access
        const response = await request(app)
            .get(`/api/recommendations/${recommendationId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(recommendationId);
    });

    it('should prevent unauthorized access to private recommendation', async () => {
        // Create another user
        const otherUser = await createTestUser();
        createdUserIds.push(otherUser.id);
        const otherUserToken = generateTestToken(otherUser.id);

        const city = await createTestCity();
        const category = await query('SELECT id FROM recommendation_categories LIMIT 1');
        
        const privateRecommendation = {
            place_name: 'Private Place 2',
            description: 'Private description',
            category_id: category.rows[0].id,
            city_name: city.name,
            user_rating: 5,
            visibility: 'private'
        };

        const createResponse = await request(app)
            .post('/api/recommendations')
            .set('Authorization', `Bearer ${authToken}`)
            .send(privateRecommendation)
            .expect(201);

        const recommendationId = createResponse.body.data.id;
        createdRecommendationIds.push(recommendationId);

        // Other user should not be able to access private content
        const response = await request(app)
            .get(`/api/recommendations/${recommendationId}`)
            .set('Authorization', `Bearer ${otherUserToken}`)
            .expect(403);

        expect(response.body.success).toBe(false);
    });
});

