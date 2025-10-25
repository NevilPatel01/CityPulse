/**
 * OWASP ZAP Security Testing Suite
 * Tests for SQL Injection, XSS, and other security vulnerabilities
 */

import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('OWASP Security Tests', () => {
    let authToken: string;
    let testUserId: number;

    const app = createApp();
    beforeAll(async () => {
        // Create test user for authenticated endpoints
        const testUser = {
            email: `security-test-${Date.now()}@test.com`,
            password: 'SecurePass123!@#',
            username: `securitytest${Date.now()}`,
            fullName: 'Security Test User'
        };

        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        authToken = registerResponse.body.token;
        testUserId = registerResponse.body.data.id;
    });

    afterAll(async () => {
        // Cleanup
        if (testUserId) {
            await query('DELETE FROM user_profiles WHERE user_id = $1', [testUserId]);
            await query('DELETE FROM users WHERE id = $1', [testUserId]);
        }
    });

    describe('SQL Injection Tests', () => {
        const sqlInjectionPayloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' OR '1'='1' /*",
            "admin'--",
            "' UNION SELECT NULL--",
            "' UNION SELECT NULL, NULL--",
            "1' AND '1'='1",
            "1' AND '1'='2",
            "' OR 1=1--",
            "\" OR \"1\"=\"1",
            "' OR 'x'='x",
            "1; DROP TABLE users--",
            "1'; DROP TABLE users; --",
            "' OR EXISTS(SELECT * FROM users WHERE username='admin')--",
            "admin' AND 1=0 UNION ALL SELECT 'admin', 'password'--",
        ];

        describe('Login Endpoint SQLi Protection', () => {
            sqlInjectionPayloads.forEach((payload) => {
                it(`should prevent SQL injection with payload: ${payload}`, async () => {
                    const response = await request(app)
                        .post('/api/auth/login')
                        .send({
                            email: payload,
                            password: 'anypassword'
                        });

                    // Should either return 400 (validation error) or 401 (invalid credentials)
                    // Should NOT return 500 (server error) or expose database structure
                    expect([400, 401]).toContain(response.status);
                    expect(response.body).not.toHaveProperty('stack');
                    expect(response.body.message).not.toMatch(/SQL|syntax|database/i);
                });
            });
        });

        describe('Search Endpoint SQLi Protection', () => {
            sqlInjectionPayloads.forEach((payload) => {
                it(`should prevent SQL injection in search with payload: ${payload}`, async () => {
                    const response = await request(app)
                        .get('/api/search')
                        .query({ q: payload });

                    // Should return results or empty array, not database errors
                    expect([200, 400]).toContain(response.status);
                    if (response.status === 200) {
                        expect(response.body.data).toBeDefined();
                    }
                    expect(response.body).not.toHaveProperty('stack');
                    expect(response.body.message || '').not.toMatch(/SQL|syntax|database/i);
                });
            });
        });

        describe('Profile Endpoint SQLi Protection', () => {
            sqlInjectionPayloads.forEach((payload) => {
                it(`should prevent SQL injection in profile lookup with payload: ${payload}`, async () => {
                    const response = await request(app)
                        .get(`/api/profile/${encodeURIComponent(payload)}`);

                    // Should return 404 (not found) or 400 (bad request), not 500
                    expect([404, 400]).toContain(response.status);
                    expect(response.body).not.toHaveProperty('stack');
                    expect(response.body.message || '').not.toMatch(/SQL|syntax|database/i);
                });
            });
        });

        describe('Recommendation Creation SQLi Protection', () => {
            sqlInjectionPayloads.forEach((payload) => {
                it(`should prevent SQL injection in recommendation creation with payload: ${payload}`, async () => {
                    const response = await request(app)
                        .post('/api/recommendations')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            title: payload,
                            description: payload,
                            categoryId: 1,
                            address: payload,
                            latitude: 40.7128,
                            longitude: -74.0060
                        });

                    // Should handle gracefully - either success or validation error
                    expect([200, 201, 400, 422]).toContain(response.status);
                    expect(response.body).not.toHaveProperty('stack');
                    expect(response.body.message || '').not.toMatch(/SQL|syntax|database/i);
                });
            });
        });
    });

    describe('Cross-Site Scripting (XSS) Tests', () => {
        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg/onload=alert("XSS")>',
            '"><script>alert(String.fromCharCode(88,83,83))</script>',
            '<iframe src="javascript:alert(\'XSS\')">',
            '<body onload=alert("XSS")>',
            '<input onfocus=alert("XSS") autofocus>',
            '<select onfocus=alert("XSS") autofocus>',
            '<textarea onfocus=alert("XSS") autofocus>',
            '<keygen onfocus=alert("XSS") autofocus>',
            '<video><source onerror="alert(\'XSS\')">',
            '<audio src=x onerror=alert("XSS")>',
            '<details open ontoggle=alert("XSS")>',
            '<marquee onstart=alert("XSS")>',
            'javascript:alert("XSS")',
            '<a href="javascript:alert(\'XSS\')">Click</a>',
            '<div style="background:url(javascript:alert(\'XSS\'))">',
        ];

        describe('Profile Update XSS Protection', () => {
            xssPayloads.forEach((payload) => {
                it(`should sanitize XSS payload in profile bio: ${payload.substring(0, 50)}...`, async () => {
                    const response = await request(app)
                        .put('/api/profile')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            bio: payload,
                            currentLocation: 'Test Location'
                        });

                    // Should accept the update but sanitize the content
                    if (response.status === 200) {
                        // Verify the payload is sanitized or rejected
                        expect(response.body.data.bio).not.toContain('<script>');
                        expect(response.body.data.bio).not.toContain('javascript:');
                        expect(response.body.data.bio).not.toContain('onerror=');
                        expect(response.body.data.bio).not.toContain('onload=');
                    } else {
                        // Or the server rejects malicious input
                        expect([400, 422]).toContain(response.status);
                    }
                });
            });
        });

        describe('Recommendation XSS Protection', () => {
            xssPayloads.forEach((payload) => {
                it(`should sanitize XSS payload in recommendation: ${payload.substring(0, 50)}...`, async () => {
                    const response = await request(app)
                        .post('/api/recommendations')
                        .set('Authorization', `Bearer ${authToken}`)
                        .send({
                            title: `Test Recommendation ${Date.now()}`,
                            description: payload,
                            categoryId: 1,
                            address: '123 Test St',
                            latitude: 40.7128,
                            longitude: -74.0060
                        });

                    if (response.status === 201 || response.status === 200) {
                        // Content should be sanitized
                        expect(response.body.data.description).not.toContain('<script>');
                        expect(response.body.data.description).not.toContain('javascript:');
                        expect(response.body.data.description).not.toContain('onerror=');
                    } else {
                        // Or rejected by validation
                        expect([400, 422]).toContain(response.status);
                    }
                });
            });
        });

        describe('Search XSS Protection', () => {
            xssPayloads.forEach((payload) => {
                it(`should handle XSS payload in search safely: ${payload.substring(0, 50)}...`, async () => {
                    const response = await request(app)
                        .get('/api/search')
                        .query({ q: payload });

                    // Search should handle malicious input safely
                    expect([200, 400]).toContain(response.status);
                    if (response.status === 200) {
                        // Response should not echo back dangerous content unescaped
                        const responseStr = JSON.stringify(response.body);
                        expect(responseStr).not.toContain('<script>');
                        expect(responseStr).not.toContain('javascript:');
                    }
                });
            });
        });
    });

    describe('HTTP Security Headers Tests', () => {
        it('should have X-Content-Type-Options header', async () => {
            const response = await request(app).get('/api/health');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });

        it('should have X-Frame-Options header', async () => {
            const response = await request(app).get('/api/health');
            expect(response.headers['x-frame-options']).toBeDefined();
        });

        it('should have X-XSS-Protection header', async () => {
            const response = await request(app).get('/api/health');
            expect(response.headers['x-xss-protection']).toBeDefined();
        });

        it('should have Strict-Transport-Security header in production', async () => {
            const response = await request(app).get('/api/health');
            // In development this might not be set, but should be in production
            if (process.env.NODE_ENV === 'production') {
                expect(response.headers['strict-transport-security']).toBeDefined();
            }
        });

        it('should have Content-Security-Policy header', async () => {
            const response = await request(app).get('/api/health');
            expect(response.headers['content-security-policy']).toBeDefined();
        });
    });

    describe('Authentication Security Tests', () => {
        it('should not expose sensitive error details on failed login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            // Should not reveal whether email exists or password is wrong
            expect(response.body.message).not.toContain('email');
            expect(response.body.message).not.toContain('user not found');
            expect(response.body).not.toHaveProperty('stack');
        });

        it('should protect against timing attacks on login', async () => {
            const validEmail = `timing-test-${Date.now()}@test.com`;
            
            // Register user first
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: validEmail,
                    password: 'SecurePass123!@#',
                    username: `timingtest${Date.now()}`,
                    fullName: 'Timing Test'
                });

            // Try login with valid email, wrong password
            const start1 = Date.now();
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: validEmail,
                    password: 'wrongpassword'
                });
            const time1 = Date.now() - start1;

            // Try login with invalid email
            const start2 = Date.now();
            await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'wrongpassword'
                });
            const time2 = Date.now() - start2;

            // Response times should be similar (within reasonable threshold)
            // This helps prevent username enumeration via timing attacks
            const timeDifference = Math.abs(time1 - time2);
            expect(timeDifference).toBeLessThan(100); // 100ms threshold
        });

        it('should not accept weak passwords', async () => {
            const weakPasswords = [
                '123456',
                'password',
                'abc123',
                'qwerty',
                'test',
            ];

            for (const weakPassword of weakPasswords) {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email: `weak-${Date.now()}@test.com`,
                        password: weakPassword,
                        username: `weak${Date.now()}`,
                        fullName: 'Weak Password Test'
                    });

                expect([400, 422]).toContain(response.status);
                expect(response.body.message || '').toMatch(/password/i);
            }
        });
    });

    describe('Authorization Tests', () => {
        it('should prevent unauthorized access to protected endpoints', async () => {
            const protectedEndpoints = [
                { method: 'get', path: '/api/profile' },
                { method: 'put', path: '/api/profile' },
                { method: 'post', path: '/api/recommendations' },
                { method: 'post', path: '/api/profile/photo' },
            ];

            for (const endpoint of protectedEndpoints) {
                const response = await (request(app) as any)[endpoint.method](endpoint.path);
                expect(response.status).toBe(401);
                expect(response.body.message).toMatch(/token|auth|unauthorized/i);
            }
        });

        it('should reject invalid JWT tokens', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', 'Bearer invalid-token-here');

            expect([401, 403]).toContain(response.status);
        });

        it('should reject expired JWT tokens', async () => {
            // This would require creating an expired token
            // Implementation depends on your JWT setup
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
            
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('Input Validation Tests', () => {
        it('should reject excessively long inputs', async () => {
            const longString = 'A'.repeat(10000); // 10KB string

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: `${longString}@test.com`,
                    password: 'SecurePass123!@#',
                    username: longString,
                    fullName: longString
                });

            expect([400, 422]).toContain(response.status);
        });

        it('should validate email format', async () => {
            const invalidEmails = [
                'notanemail',
                '@test.com',
                'test@',
                'test..test@test.com',
                'test@test',
            ];

            for (const email of invalidEmails) {
                const response = await request(app)
                    .post('/api/auth/register')
                    .send({
                        email,
                        password: 'SecurePass123!@#',
                        username: `test${Date.now()}`,
                        fullName: 'Test User'
                    });

                expect([400, 422]).toContain(response.status);
            }
        });

        it('should prevent path traversal in file operations', async () => {
            const pathTraversalPayloads = [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32',
                '....//....//....//etc/passwd',
            ];

            for (const payload of pathTraversalPayloads) {
                const response = await request(app)
                    .get(`/api/profile/${encodeURIComponent(payload)}`);

                // Should return 404, not expose file system
                expect([404, 400]).toContain(response.status);
                expect(response.body).not.toHaveProperty('stack');
            }
        });
    });

    describe('Rate Limiting Tests', () => {
        it('should have rate limiting on authentication endpoints', async () => {
            // Note: This test might be skipped in test environment if rate limiting is disabled
            if (process.env.NODE_ENV === 'test') {
                console.log('Rate limiting test skipped in test environment');
                return;
            }

            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(
                    request(app)
                        .post('/api/auth/login')
                        .send({
                            email: 'test@test.com',
                            password: 'wrongpassword'
                        })
                );
            }

            const responses = await Promise.all(requests);
            const tooManyRequests = responses.some(r => r.status === 429);
            
            // In production, some requests should be rate limited
            if (process.env.NODE_ENV === 'production') {
                expect(tooManyRequests).toBe(true);
            }
        });
    });

    describe('Error Handling Tests', () => {
        it('should not expose stack traces in error responses', async () => {
            // Try to trigger an error
            const response = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Missing required fields to trigger error
                    title: 'Test'
                });

            expect(response.body).not.toHaveProperty('stack');
            expect(response.body).not.toHaveProperty('trace');
        });

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('{"invalid json": }');

            expect([400, 422]).toContain(response.status);
            expect(response.body).not.toHaveProperty('stack');
        });
    });
});
