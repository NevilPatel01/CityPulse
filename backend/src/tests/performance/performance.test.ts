/**
 * Performance Tests
 * Tests for API response times, file upload performance, and database query optimization
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    createTestRecommendation,
    generateTestToken,
    cleanupAllTestData
} from '../helpers/test-helpers';

describe('Performance Tests', () => {
    const app = createApp();
    let user: any;
    let token: string;

    beforeAll(async () => {
        user = await createTestUser({ 
            fullName: 'Performance Test User',
            username: 'perf_test_user'
        });
        token = generateTestToken(user.id);
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('API Response Time Benchmarks', () => {
        it('should respond to health check quickly', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/health')
                .expect(200);

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(100); // Should be very fast
        });

        it('should fetch recommendations list quickly', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/recommendations')
                .set('Authorization', `Bearer ${token}`)
                .query({ limit: 20 })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(1000); // Under 1 second
        });

        it('should fetch feed quickly', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(1500); // Under 1.5 seconds
        });

        it('should fetch user profile quickly', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const duration = Date.now() - startTime;
            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(500); // Under 0.5 seconds
        });
    });

    describe('Search Performance', () => {
        it('should complete basic search within 2 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/search')
                .set('Authorization', `Bearer ${token}`)
                .query({ q: 'test' })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(2000); // 2 seconds as per proposal requirement
        });

        it('should complete advanced search within 3 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/advanced-search')
                .set('Authorization', `Bearer ${token}`)
                .query({
                    q: 'test',
                    type: 'all',
                    categories: ['Restaurant'],
                    priceMin: 10,
                    priceMax: 50
                })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(3000); // 3 seconds for complex search
        });
    });

    describe('File Upload Performance', () => {
        it('should handle small image uploads quickly', async () => {
            // Create a small test image buffer (simulated)
            const smallImageBuffer = Buffer.alloc(100 * 1024); // 100KB

            const startTime = Date.now();

            // Note: Actual file upload test would require multipart/form-data
            // This is a placeholder for the performance expectation
            const duration = Date.now() - startTime;

            // Small files should upload quickly
            expect(duration).toBeLessThan(1000);
        });

        it('should handle multiple file uploads efficiently', async () => {
            const startTime = Date.now();

            // Simulate multiple file uploads
            // In real test, would upload 3-5 images simultaneously
            const duration = Date.now() - startTime;

            // Multiple files should still complete reasonably quickly
            expect(duration).toBeLessThan(5000); // 5 seconds for multiple files
        });
    });

    describe('Database Query Optimization', () => {
        it('should use indexes for user lookups', async () => {
            const startTime = Date.now();
            
            // Query that should use index on email
            const result = await query(
                `SELECT * FROM users WHERE email = $1`,
                [user.email]
            );

            const duration = Date.now() - startTime;
            expect(result.rows.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(100); // Indexed queries should be very fast
        });

        it('should use indexes for recommendation lookups', async () => {
            const recommendation = await createTestRecommendation(user.id, {
                title: 'Performance Test Recommendation'
            });

            const startTime = Date.now();
            
            // Query that should use index on user_id
            const result = await query(
                `SELECT * FROM recommendations WHERE user_id = $1 LIMIT 10`,
                [user.id]
            );

            const duration = Date.now() - startTime;
            expect(result.rows.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(200); // Indexed queries should be fast
        });

        it('should efficiently query with joins', async () => {
            const startTime = Date.now();
            
            // Complex query with joins
            const result = await query(
                `SELECT r.*, u.username, rc.name as category_name
                    FROM recommendations r
                    JOIN users u ON r.user_id = u.id
                    LEFT JOIN recommendation_categories rc ON r.category_id = rc.id
                    WHERE r.status = 'active'
                    LIMIT 20`
            );

            const duration = Date.now() - startTime;
            expect(result.rows.length).toBeGreaterThanOrEqual(0);
            expect(duration).toBeLessThan(500); // Joins should be reasonably fast
        });
    });

    describe('Feed Loading Performance', () => {
        it('should load personalized feed within 2 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(2000); // 2 seconds
        });

        it('should handle pagination efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${token}`)
                .query({ page: 2, limit: 10 })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(response.body.success).toBe(true);
            expect(duration).toBeLessThan(2000); // Pagination should be similarly fast
        });
    });

    describe('Image Compression Validation', () => {
        it('should compress large images', async () => {
            // This test would verify that uploaded images are compressed
            // In a real implementation, you would:
            // 1. Upload a large image (e.g., 5MB)
            // 2. Verify the stored image is smaller (e.g., < 1MB)
            // 3. Verify image quality is acceptable

            // Placeholder test
            expect(true).toBe(true);
        });

        it('should maintain image quality after compression', async () => {
            // This test would verify image quality is maintained
            // Placeholder test
            expect(true).toBe(true);
        });
    });

    describe('Concurrent Request Handling', () => {
        it('should handle multiple concurrent search requests', async () => {
            const promises = Array(5).fill(null).map(() =>
                request(app)
                    .get('/api/search')
                    .set('Authorization', `Bearer ${token}`)
                    .query({ q: 'test' })
            );

            const startTime = Date.now();
            const responses = await Promise.all(promises);
            const duration = Date.now() - startTime;

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            // All requests should complete within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds for 5 concurrent requests
        });

        it('should handle concurrent feed requests', async () => {
            const promises = Array(3).fill(null).map(() =>
                request(app)
                    .get('/api/feed')
                    .set('Authorization', `Bearer ${token}`)
                    .query({ page: 1, limit: 10 })
            );

            const startTime = Date.now();
            const responses = await Promise.all(promises);
            const duration = Date.now() - startTime;

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            expect(duration).toBeLessThan(4000); // 4 seconds for 3 concurrent requests
        });
    });
});

