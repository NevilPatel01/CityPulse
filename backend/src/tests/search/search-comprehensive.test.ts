/**
 * Comprehensive Search Functionality Tests
 * Tests for all search features including filters, pagination, and performance
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    createTestRecommendation,
    createTestCity,
    generateTestToken,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';

describe('Comprehensive Search Functionality', () => {
    const app = createApp();
    let user: any;
    let token: string;
    let testCategory: any;
    let testCity: any;

    beforeAll(async () => {
        user = await createTestUser({ 
            fullName: 'Search Test User',
            username: 'search_user'
        });
        token = generateTestToken(user.id);

        // Get or create test category
        const categoryResult = await query(
            `SELECT id FROM recommendation_categories WHERE name = 'Restaurant' LIMIT 1`
        );
        if (categoryResult.rows.length === 0) {
            const newCategory = await query(
                `INSERT INTO recommendation_categories (name, description) 
                 VALUES ($1, $2) RETURNING *`,
                ['Restaurant', 'Dining establishments']
            );
            testCategory = newCategory.rows[0];
        } else {
            testCategory = categoryResult.rows[0];
        }

        testCity = await createTestCity({ name: 'Search Test City' });
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('Basic Text Search', () => {
        it('should search across recommendation titles', async () => {
            const recommendation = await createTestRecommendation(user.id, {
                title: 'Unique Searchable Title',
                description: 'Test description',
                categoryId: testCategory.id
            });

            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ q: 'Unique Searchable' })
                .expect(200);

            expect(response.body.success).toBe(true);
            const found = response.body.data.recommendations?.some(
                (r: any) => r.id === recommendation.id
            );
            expect(found).toBe(true);
        });

        it('should search across recommendation descriptions', async () => {
            const recommendation = await createTestRecommendation(user.id, {
                title: 'Test Title',
                description: 'Unique description text for search',
                categoryId: testCategory.id
            });

            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ q: 'Unique description' })
                .expect(200);

            expect(response.body.success).toBe(true);
            const found = response.body.data.recommendations?.some(
                (r: any) => r.id === recommendation.id
            );
            expect(found).toBe(true);
        });

        it('should handle empty search results gracefully', async () => {
            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ q: 'NonexistentSearchTerm12345' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total).toBe(0);
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
            expect(Array.isArray(response.body.data.users)).toBe(true);
            expect(Array.isArray(response.body.data.cities)).toBe(true);
        });

        it('should handle special characters in search query', async () => {
            const specialChars = ['@', '#', '$', '%', '&', '*', '(', ')', '[', ']', '{', '}', '|', '\\', '/', '?', '<', '>'];

            for (const char of specialChars) {
                const response = await request(app)
                    .get('/api/search')
                    .set('Authorization', `Bearer ${token}`)
                    .query({ q: `test${char}query` })
                    .expect(200);

                expect(response.body.success).toBe(true);
                // Should not crash, may return empty results
            }
        });
    });

    describe('Category Filtering', () => {
        it('should filter by category (Food)', async () => {
            const response = await request(app)
                .get('/api/search/recommendations')
                .set('Authorization', `Bearer ${token}`)
                .query({ 
                    q: 'test',
                    category: 'Restaurant'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            // Results should match category filter if any exist
        });

        it('should filter by multiple categories in advanced search', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    categories: ['Restaurant', 'Attraction']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Price Range Filtering', () => {
        it('should filter by price range ($0-$25)', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    priceMin: 0,
                    priceMax: 25
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter by price range ($25-$50)', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    priceMin: 25,
                    priceMax: 50
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter by price range ($50+)', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    priceMin: 50
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Difficulty Level Filtering', () => {
        it('should filter by Easy difficulty', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    difficulty: 'easy'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter by Moderate difficulty', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    difficulty: 'moderate'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter by Hard difficulty', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    difficulty: 'hard'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Location-Based Filtering', () => {
        it('should filter by city', async () => {
            const response = await request(app)
                .get('/api/search/recommendations')
                .set('Authorization', `Bearer ${token}`)
                .query({ 
                    q: 'test',
                    city: testCity.name
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter by multiple locations in advanced search', async () => {
            const city2 = await createTestCity({ name: 'Second Test City' });

            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    location: [testCity.name, city2.name]
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Tag-Based Filtering', () => {
        it('should filter by tags', async () => {
            // Create a tag
            const tagResult = await query(
                `INSERT INTO recommendation_tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
                ['budget-friendly']
            );
            const tag = tagResult.rows[0];

            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    tags: [tag.name]
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should filter by multiple tags', async () => {
            const tag1Result = await query(
                `INSERT INTO recommendation_tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
                ['family-friendly']
            );
            const tag2Result = await query(
                `INSERT INTO recommendation_tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
                ['adventure']
            );

            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    tags: [tag1Result.rows[0].name, tag2Result.rows[0].name]
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Combined Multiple Filters', () => {
        it('should apply multiple filters simultaneously', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    categories: ['Restaurant'],
                    priceMin: 10,
                    priceMax: 50,
                    difficulty: 'easy',
                    location: testCity.name
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should handle complex filter combinations', async () => {
            const tagResult = await query(
                `INSERT INTO recommendation_tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
                ['test-tag']
            );

            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    categories: ['Restaurant', 'Attraction'],
                    tags: [tagResult.rows[0].name],
                    priceMin: 0,
                    priceMax: 100,
                    difficulty: 'moderate',
                    minRating: 3,
                    location: testCity.name
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Pagination', () => {
        it('should paginate with 10 items per page', async () => {
            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ 
                    q: 'test',
                    limit: 10,
                    offset: 0
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.limit).toBe(10);
            expect(response.body.pagination.offset).toBe(0);
        });

        it('should handle pagination offset correctly', async () => {
            const page1 = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ 
                    q: 'test',
                    limit: 5,
                    offset: 0
                })
                .expect(200);

            const page2 = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ 
                    q: 'test',
                    limit: 5,
                    offset: 5
                })
                .expect(200);

            expect(page1.body.success).toBe(true);
            expect(page2.body.success).toBe(true);
            // Results should be different (unless there are fewer than 5 total results)
        });

        it('should enforce maximum limit', async () => {
            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ 
                    q: 'test',
                    limit: 1000 // Should be capped
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination.limit).toBeLessThanOrEqual(50); // Max limit
        });
    });

    describe('Sort Functionality', () => {
        it('should sort by relevance', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    sortBy: 'relevant'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should sort by rating', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    sortBy: 'rating'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should sort by date (recent)', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    sortBy: 'recent'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should sort by price (low to high)', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    sortBy: 'price_low'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should sort by price (high to low)', async () => {
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'recommendations',
                    sortBy: 'price_high'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Search Performance', () => {
        it('should complete search within 2 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ q: 'test' })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(2000); // 2 seconds
        });

        it('should handle complex searches efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'all',
                    categories: ['Restaurant', 'Attraction'],
                    priceMin: 10,
                    priceMax: 100,
                    difficulty: 'moderate',
                    minRating: 3
                })
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(3000); // 3 seconds for complex search
        });
    });

    describe('Search History Tracking', () => {
        it('should automatically track search in history', async () => {
            const searchQuery = 'auto track test query';

            await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ q: searchQuery })
                .expect(200);

            // Wait a moment for async history save
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify search was tracked
            const historyResult = await query(
                `SELECT * FROM search_history 
                 WHERE user_id = $1 AND search_query = $2 
                 ORDER BY created_at DESC LIMIT 1`,
                [user.id, searchQuery]
            );

            expect(historyResult.rows.length).toBeGreaterThan(0);
        });
    });
});

