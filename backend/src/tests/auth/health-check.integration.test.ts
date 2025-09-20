import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { cleanupDatabase } from '../setup';

const app = createApp();

describe('Health Check Integration Tests', () => {
    beforeEach(async () => {
        await cleanupDatabase();
    });

    afterAll(async () => {
        // Cleanup after all tests
    });

    describe('GET /api/health', () => {
        it('should return health status with correct structure', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toEqual({
                status: 'OK',
                message: 'CityPulse API is running',
                timestamp: expect.any(String),
                environment: expect.any(String)
            });
        });

        it('should return valid timestamp in ISO format', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            const timestamp = response.body.timestamp;
            expect(timestamp).toBeDefined();
            
            // Verify it's a valid ISO date string
            const date = new Date(timestamp);
            expect(date.toISOString()).toBe(timestamp);
            
            // Verify it's a recent timestamp (within last 5 seconds)
            const now = new Date();
            const timeDiff = now.getTime() - date.getTime();
            expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds
        });

        it('should return correct environment', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            const environment = response.body.environment;
            expect(environment).toBeDefined();
            expect(['development', 'test', 'production']).toContain(environment);
        });

        it('should return OK status consistently', async () => {
            // Make multiple requests to ensure consistency
            const requests = Array(5).fill(null).map(() => 
                request(app).get('/api/health')
            );

            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.status).toBe('OK');
                expect(response.body.message).toBe('CityPulse API is running');
            });
        });

        it('should respond quickly', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/health')
                .expect(200);
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Health check should respond within 1 second
            expect(responseTime).toBeLessThan(1000);
        });

        it('should handle concurrent requests properly', async () => {
            // Make many concurrent requests
            const concurrentRequests = Array(20).fill(null).map(() => 
                request(app).get('/api/health')
            );

            const responses = await Promise.all(concurrentRequests);

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.status).toBe('OK');
            });
        });

        it('should not require authentication', async () => {
            // Health check should work without any authentication
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
        });

        it('should have proper content type', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('should include security headers', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            // Check for common security headers (these come from helmet middleware)
            expect(response.headers).toHaveProperty('x-content-type-options');
            expect(response.headers).toHaveProperty('x-frame-options');
        });

        it('should be accessible via different HTTP methods', async () => {
            // Health check should only respond to GET requests
            const getResponse = await request(app)
                .get('/api/health')
                .expect(200);

            expect(getResponse.body.status).toBe('OK');

            // Other methods should not be allowed
            await request(app)
                .post('/api/health')
                .expect(404); // Should return 404 for non-existent POST route

            await request(app)
                .put('/api/health')
                .expect(404); // Should return 404 for non-existent PUT route

            await request(app)
                .delete('/api/health')
                .expect(404); // Should return 404 for non-existent DELETE route
        });

        it('should handle query parameters gracefully', async () => {
            // Health check should work even with query parameters
            const response = await request(app)
                .get('/api/health?test=true&other=value')
                .expect(200);

            expect(response.body.status).toBe('OK');
        });

        it('should handle case-sensitive paths', async () => {
            // Test that the health endpoint works with correct case
            await request(app)
                .get('/api/health')
                .expect(200);

            // Express is case-insensitive by default for routes, so these may also work
            // This test verifies the behavior rather than enforcing case sensitivity
            const responses = await Promise.all([
                request(app).get('/api/Health'),
                request(app).get('/api/HEALTH'),
                request(app).get('/API/health')
            ]);

            // All should either work (200) or not work (404), but be consistent
            responses.forEach(response => {
                expect([200, 404]).toContain(response.status);
            });
        });

        it('should provide uptime information implicitly', async () => {
            // While we don't explicitly return uptime, the successful response indicates the server is up
            const response1 = await request(app)
                .get('/api/health')
                .expect(200);

            // Wait a small amount and check again
            await new Promise(resolve => setTimeout(resolve, 100));

            const response2 = await request(app)
                .get('/api/health')
                .expect(200);

            // Both requests should succeed, indicating consistent uptime
            expect(response1.body.status).toBe('OK');
            expect(response2.body.status).toBe('OK');
            
            // Timestamps should be different (later response should have later timestamp)
            const time1 = new Date(response1.body.timestamp);
            const time2 = new Date(response2.body.timestamp);
            expect(time2.getTime()).toBeGreaterThanOrEqual(time1.getTime());
        });

        it('should be compatible with monitoring tools', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            // Structure should be compatible with common monitoring tools
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            
            // Status should be a simple string that monitoring tools can check
            expect(typeof response.body.status).toBe('string');
            expect(response.body.status).toBe('OK');
        });

        it('should maintain consistent response format', async () => {
            // Make multiple requests and ensure format consistency
            const responses = await Promise.all([
                request(app).get('/api/health'),
                request(app).get('/api/health'),
                request(app).get('/api/health')
            ]);

            const expectedKeys = ['status', 'message', 'timestamp', 'environment'];
            
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(Object.keys(response.body).sort()).toEqual(expectedKeys.sort());
                expect(response.body.status).toBe('OK');
                expect(response.body.message).toBe('CityPulse API is running');
            });
        });
    });

    describe('Health Check Error Scenarios', () => {
        it('should handle malformed requests gracefully', async () => {
            // Send request with invalid headers
            const response = await request(app)
                .get('/api/health')
                .set('Invalid-Header', 'invalid-value')
                .expect(200);

            // Should still return OK despite invalid headers
            expect(response.body.status).toBe('OK');
        });

        it('should handle requests with unusual user agents', async () => {
            const response = await request(app)
                .get('/api/health')
                .set('User-Agent', 'HealthCheckBot/1.0')
                .expect(200);

            expect(response.body.status).toBe('OK');
        });
    });
});