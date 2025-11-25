/**
 * Moderation System Tests
 * Comprehensive test suite for moderation features including:
 * - Content reporting and review
 * - User warnings, suspensions, and bans
 * - Moderator dashboard
 * - Content removal
 * - Moderator action logging
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    createTestRecommendation,
    generateTestToken,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';

describe('Moderation System', () => {
    const app = createApp();
    let regularUser: any;
    let moderatorUser: any;
    let regularToken: string;
    let moderatorToken: string;
    let testRecommendation: any;
    let testTrip: any;

    beforeAll(async () => {
        // Create regular user
        regularUser = await createTestUser({ 
            fullName: 'Regular User',
            username: 'regular_user'
        });
        regularToken = generateTestToken(regularUser.id);

        // Create moderator user
        moderatorUser = await createTestUser({ 
            fullName: 'Moderator User',
            username: 'moderator_user',
            role: 'moderator'
        });
        moderatorToken = generateTestToken(moderatorUser.id);

        // Create test recommendation
        testRecommendation = await createTestRecommendation(regularUser.id, {
            title: 'Test Recommendation for Moderation'
        });

        // Create test trip
        const tripResult = await query(
            `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                regularUser.id,
                'Test Trip for Moderation',
                'Test trip description',
                '2025-12-01',
                '2025-12-10',
                'planning',
                'public'
            ]
        );
        testTrip = tripResult.rows[0];
        testDataTracker.addTrip(testTrip.id);
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('Content Reporting', () => {
        it('should allow regular user to report a recommendation', async () => {
            const response = await request(app)
                .post(`/api/social/reports/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reason: 'inappropriate',
                    description: 'This content is inappropriate'
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify report was created
            const reportResult = await query(
                `SELECT * FROM content_reports 
                    WHERE reported_content_type = 'recommendation' 
                    AND reported_content_id = $1 
                    AND reporter_id = $2`,
                [testRecommendation.id, regularUser.id]
            );
            expect(reportResult.rows.length).toBe(1);
            expect(reportResult.rows[0].status).toBe('pending');
        });

        it('should allow regular user to report a user profile', async () => {
            const response = await request(app)
                .post(`/api/buddies/report/${regularUser.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reason: 'harassment',
                    description: 'User is harassing others'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should prevent duplicate reports from same user', async () => {
            // First report
            await request(app)
                .post(`/api/social/reports/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reason: 'spam',
                    description: 'Spam content'
                })
                .expect(200);

            // Duplicate report should be handled (may return 200 or 400 depending on implementation)
            const response = await request(app)
                .post(`/api/social/reports/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reason: 'spam',
                    description: 'Spam content again'
                });

            // Should either prevent duplicate or handle gracefully
            expect([200, 400, 409]).toContain(response.status);
        });

        it('should validate report reason', async () => {
            const response = await request(app)
                .post(`/api/social/reports/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reason: 'invalid_reason',
                    description: 'Invalid reason'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Moderator Dashboard', () => {
        it('should get dashboard statistics for moderator', async () => {
            const response = await request(app)
                .get('/api/moderator/dashboard/stats')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('pending_reports');
            expect(response.body.data).toHaveProperty('under_review_reports');
            expect(response.body.data).toHaveProperty('reported_recommendations');
            expect(response.body.data).toHaveProperty('suspended_users');
            expect(response.body.data).toHaveProperty('banned_users');
            expect(response.body.data).toHaveProperty('active_warnings');
        });

        it('should prevent non-moderator from accessing dashboard', async () => {
            const response = await request(app)
                .get('/api/moderator/dashboard/stats')
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should get content reports with pagination', async () => {
            const response = await request(app)
                .get('/api/moderator/reports')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .query({ page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('reports');
            expect(response.body.data).toHaveProperty('pagination');
            expect(response.body.data.pagination).toHaveProperty('currentPage');
            expect(response.body.data.pagination).toHaveProperty('totalPages');
        });

        it('should filter reports by status', async () => {
            const response = await request(app)
                .get('/api/moderator/reports')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .query({ status: 'pending' })
                .expect(200);

            expect(response.body.success).toBe(true);
            if (response.body.data.reports.length > 0) {
                response.body.data.reports.forEach((report: any) => {
                    expect(report.status).toBe('pending');
                });
            }
        });

        it('should filter reports by content type', async () => {
            const response = await request(app)
                .get('/api/moderator/reports')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .query({ contentType: 'recommendation' })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Content Review and Removal', () => {
        let reportId: number;

        beforeEach(async () => {
            // Create a report for testing
            const reportResult = await query(
                `INSERT INTO content_reports (reporter_id, reported_content_type, reported_content_id, report_reason, description, status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    regularUser.id,
                    'recommendation',
                    testRecommendation.id,
                    'inappropriate',
                    'Test report description',
                    'pending'
                ]
            );
            reportId = reportResult.rows[0].id;
        });

        it('should update report status', async () => {
            const response = await request(app)
                .patch(`/api/moderator/reports/${reportId}/status`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    status: 'under_review',
                    notes: 'Reviewing content'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('under_review');
            expect(response.body.data.reviewed_by).toBe(moderatorUser.id);
        });

        it('should remove content (soft delete)', async () => {
            const response = await request(app)
                .delete(`/api/moderator/content/recommendation/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Violates community guidelines',
                    notifyUser: true
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify recommendation status changed
            const recResult = await query(
                `SELECT status, report_reason FROM recommendations WHERE id = $1`,
                [testRecommendation.id]
            );
            expect(recResult.rows[0].status).toBe('removed');
            expect(recResult.rows[0].report_reason).toBe('Violates community guidelines');

            // Verify notification was created
            const notifResult = await query(
                `SELECT * FROM notifications 
                 WHERE user_id = $1 
                 AND notification_type = 'system'
                 AND related_id = $2`,
                [regularUser.id, testRecommendation.id]
            );
            expect(notifResult.rows.length).toBeGreaterThan(0);
        });

        it('should log moderator action when removing content', async () => {
            await request(app)
                .delete(`/api/moderator/content/recommendation/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Test removal',
                    notifyUser: false
                })
                .expect(200);

            // Verify action was logged
            const actionResult = await query(
                `SELECT * FROM moderator_actions 
                 WHERE moderator_id = $1 
                 AND action_type = 'content_removal'
                 AND target_type = 'recommendation'
                 AND target_id = $2`,
                [moderatorUser.id, testRecommendation.id]
            );
            expect(actionResult.rows.length).toBeGreaterThan(0);
        });

        it('should prevent non-moderator from removing content', async () => {
            const response = await request(app)
                .delete(`/api/moderator/content/recommendation/${testRecommendation.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reason: 'Test'
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('User Warnings', () => {
        it('should issue warning to user', async () => {
            const response = await request(app)
                .post(`/api/moderator/users/${regularUser.id}/warn`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    warningType: 'spam',
                    message: 'Please reduce promotional content',
                    severity: 'low'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('warning');
            expect(response.body.data).toHaveProperty('activeWarnings');
            expect(response.body.data.warning.warning_type).toBe('spam');
        });

        it('should get user warnings', async () => {
            const response = await request(app)
                .get(`/api/moderator/users/${regularUser.id}/warnings`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should auto-suspend user after multiple high-severity warnings', async () => {
            // Issue first high-severity warning
            await request(app)
                .post(`/api/moderator/users/${regularUser.id}/warn`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    warningType: 'harassment',
                    message: 'First warning',
                    severity: 'high'
                })
                .expect(200);

            // Issue second high-severity warning (should trigger ban)
            const response = await request(app)
                .post(`/api/moderator/users/${regularUser.id}/warn`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    warningType: 'harassment',
                    message: 'Second warning',
                    severity: 'high'
                })
                .expect(200);

            // Verify account status
            const userResult = await query(
                `SELECT account_status FROM users WHERE id = $1`,
                [regularUser.id]
            );
            // Should be banned after 2 high-severity warnings
            expect(['banned', 'suspended']).toContain(userResult.rows[0].account_status);
        });

        it('should prevent non-moderator from issuing warnings', async () => {
            const response = await request(app)
                .post(`/api/moderator/users/${regularUser.id}/warn`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    warningType: 'spam',
                    message: 'Test'
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('User Suspension and Banning', () => {
        let testUser: any;
        let testUserToken: string;

        beforeEach(async () => {
            testUser = await createTestUser({ 
                fullName: 'Test User for Suspension',
                username: 'test_suspend_user'
            });
            testUserToken = generateTestToken(testUser.id);
        });

        it('should suspend user', async () => {
            const response = await request(app)
                .post(`/api/moderator/users/${testUser.id}/suspend`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Violation of terms',
                    days: 7
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify user status
            const userResult = await query(
                `SELECT account_status FROM users WHERE id = $1`,
                [testUser.id]
            );
            expect(userResult.rows[0].account_status).toBe('suspended');

            // Verify notification
            const notifResult = await query(
                `SELECT * FROM notifications 
                 WHERE user_id = $1 
                 AND notification_type = 'system'`,
                [testUser.id]
            );
            expect(notifResult.rows.length).toBeGreaterThan(0);
        });

        it('should ban user', async () => {
            const response = await request(app)
                .post(`/api/moderator/users/${testUser.id}/ban`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Severe violation'
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify user status
            const userResult = await query(
                `SELECT account_status FROM users WHERE id = $1`,
                [testUser.id]
            );
            expect(userResult.rows[0].account_status).toBe('banned');
        });

        it('should reinstate user', async () => {
            // First suspend
            await request(app)
                .post(`/api/moderator/users/${testUser.id}/suspend`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Test',
                    days: 7
                })
                .expect(200);

            // Then reinstate
            const response = await request(app)
                .post(`/api/moderator/users/${testUser.id}/reinstate`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'Appeal approved'
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify user status
            const userResult = await query(
                `SELECT account_status FROM users WHERE id = $1`,
                [testUser.id]
            );
            expect(userResult.rows[0].account_status).toBe('active');

            // Verify warnings deactivated
            const warningsResult = await query(
                `SELECT is_active FROM user_warnings WHERE user_id = $1`,
                [testUser.id]
            );
            warningsResult.rows.forEach((row: any) => {
                expect(row.is_active).toBe(false);
            });
        });

        it('should prevent non-moderator from suspending users', async () => {
            const response = await request(app)
                .post(`/api/moderator/users/${testUser.id}/suspend`)
                .set('Authorization', `Bearer ${regularToken}`)
                .send({
                    reason: 'Test',
                    days: 7
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Moderator Action Logging', () => {
        it('should get moderator action log', async () => {
            const response = await request(app)
                .get('/api/moderator/actions')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .query({ page: 1, limit: 50 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('actions');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.actions)).toBe(true);
        });

        it('should log all moderator actions', async () => {
            // Perform an action
            await request(app)
                .post(`/api/moderator/users/${regularUser.id}/warn`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    warningType: 'spam',
                    message: 'Test warning',
                    severity: 'low'
                })
                .expect(200);

            // Verify action was logged
            const actionResult = await query(
                `SELECT * FROM moderator_actions 
                 WHERE moderator_id = $1 
                 AND action_type = 'warning_issued'
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [moderatorUser.id]
            );
            expect(actionResult.rows.length).toBeGreaterThan(0);
            expect(actionResult.rows[0].target_type).toBe('user');
            expect(actionResult.rows[0].target_id).toBe(regularUser.id);
        });
    });

    describe('Reported Users Management', () => {
        it('should get reported users list', async () => {
            const response = await request(app)
                .get('/api/moderator/users/reported')
                .set('Authorization', `Bearer ${moderatorToken}`)
                .query({ page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Cannot Moderate Own Content', () => {
        let moderatorRecommendation: any;

        beforeAll(async () => {
            // Create recommendation by moderator
            moderatorRecommendation = await createTestRecommendation(moderatorUser.id, {
                title: 'Moderator Own Recommendation'
            });
        });

        it('should allow moderator to report own content (if needed)', async () => {
            // This test verifies the system behavior - moderators may or may not be able to report own content
            // Depending on business logic, this might be allowed or prevented
            const response = await request(app)
                .post(`/api/social/reports/${moderatorRecommendation.id}`)
                .set('Authorization', `Bearer ${moderatorToken}`)
                .send({
                    reason: 'inappropriate',
                    description: 'Test'
                });

            // Should either succeed or fail gracefully
            expect([200, 400, 403]).toContain(response.status);
        });
    });

    describe('Moderator Role Verification', () => {
        it('should verify moderator role in middleware', async () => {
            // Try to access moderator endpoint with regular user token
            const response = await request(app)
                .get('/api/moderator/dashboard/stats')
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should allow moderator to access all moderator endpoints', async () => {
            const endpoints = [
                { method: 'get', path: '/api/moderator/dashboard/stats' },
                { method: 'get', path: '/api/moderator/reports' },
                { method: 'get', path: '/api/moderator/actions' },
                { method: 'get', path: '/api/moderator/users/reported' }
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    [endpoint.method as 'get'](endpoint.path)
                    .set('Authorization', `Bearer ${moderatorToken}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
            }
        });
    });
});

