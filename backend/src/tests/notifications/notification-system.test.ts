/**
 * Notification System Unit Tests
 * Tests for notification API endpoints and integration
 */

import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    createTestRecommendation,
    generateTestToken,
    cleanupAllTestData,
} from '../helpers/test-helpers';
import { describe, beforeAll, afterAll, afterEach, beforeEach, expect, it } from '@jest/globals';
describe('Notification System API', () => {
    const app = createApp();
    let user1: any;
    let user2: any;
    let user3: any;
    let token1: string;
    let token2: string;
    let token3: string;
    let recommendation: any;

    beforeAll(async () => {
        // Create test users
        user1 = await createTestUser({ fullName: 'Notification User One' });
        user2 = await createTestUser({ fullName: 'Notification User Two' });
        user3 = await createTestUser({ fullName: 'Notification User Three' });

        token1 = generateTestToken(user1.id);
        token2 = generateTestToken(user2.id);
        token3 = generateTestToken(user3.id);

        // Create a test recommendation
        recommendation = await createTestRecommendation(user2.id, {
            title: 'Test Restaurant',
            description: 'Great food!'
        });
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    afterEach(async () => {
        // Clean up notifications after each test
        await query(
            'DELETE FROM notifications WHERE user_id IN ($1, $2, $3)',
            [user1.id, user2.id, user3.id]
        );
    });

    describe('GET /api/notifications', () => {
        beforeEach(async () => {
            // Create multiple notifications for user1 directly in database
            await query(
                `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [user1.id, 'New Buddy Request 1', 'Test message 1', 'buddy_request', user2.id]
            );

            await query(
                `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [user1.id, 'Someone liked your post', 'Test message 2', 'recommendation_like', user2.id]
            );

            await query(
                `INSERT INTO notifications (user_id, title, message, notification_type)
                 VALUES ($1, $2, $3, $4)`,
                [user1.id, 'System notification', 'Test message 3', 'system']
            );
        });

        it('should get all notifications for user', async () => {
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(3);
            expect(response.body.data[0]).toHaveProperty('id');
            expect(response.body.data[0]).toHaveProperty('title');
            expect(response.body.data[0]).toHaveProperty('message');
            expect(response.body.data[0]).toHaveProperty('is_read');
            expect(response.body.data[0]).toHaveProperty('created_at');
        });

        it('should order notifications by created_at DESC', async () => {
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const notifications = response.body.data;
            for (let i = 1; i < notifications.length; i++) {
                const prev = new Date(notifications[i - 1].created_at);
                const curr = new Date(notifications[i].created_at);
                expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
            }
        });

        it('should support pagination with limit', async () => {
            const response = await request(app)
                .get('/api/notifications?limit=2')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(2);
        });

        it('should support pagination with offset', async () => {
            const response = await request(app)
                .get('/api/notifications?limit=2&offset=1')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.data.length).toBeLessThanOrEqual(2);
        });

        it('should filter by notification type', async () => {
            const response = await request(app)
                .get('/api/notifications?type=buddy_request')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            if (response.body.data.length > 0) {
                expect(response.body.data.every((n: any) => n.notification_type === 'buddy_request')).toBe(true);
            }
        });

        it('should filter by read status', async () => {
            // Mark one notification as read
            const allNotifications = await query(
                'SELECT id FROM notifications WHERE user_id = $1 LIMIT 1',
                [user1.id]
            );

            await query(
                'UPDATE notifications SET is_read = true WHERE id = $1',
                [allNotifications.rows[0].id]
            );

            // Get unread only
            const response = await request(app)
                .get('/api/notifications?unread=true')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.data.every((n: any) => !n.is_read)).toBe(true);
        });

        it('should return empty array when no notifications', async () => {
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${token3}`)
                .expect(200);

            expect(response.body.data).toEqual([]);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/notifications')
                .expect(401);
        });
    });

    describe('GET /api/notifications/unread-count', () => {
        beforeEach(async () => {
            // Create 3 unread and 2 read notifications
            for (let i = 0; i < 3; i++) {
                await query(
                    `INSERT INTO notifications (user_id, title, message, notification_type)
                        VALUES ($1, $2, $3, $4)`,
                    [user1.id, `Unread ${i}`, 'Test', 'system']
                );
            }

            for (let i = 0; i < 2; i++) {
                await query(
                    `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
                        VALUES ($1, $2, $3, $4, $5)`,
                    [user1.id, `Read ${i}`, 'Test', 'system', true]
                );
            }
        });

        it('should return correct unread count', async () => {
            const response = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.unreadCount).toBe(3);
        });

        it('should return 0 when no unread notifications', async () => {
            const response = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${token3}`)
                .expect(200);

            expect(response.body.data.unreadCount).toBe(0);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/notifications/unread-count')
                .expect(401);
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        let notificationId: number;

        beforeEach(async () => {
            const result = await query(
                `INSERT INTO notifications (user_id, title, message, notification_type)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [user1.id, 'Test Notification', 'Test message', 'buddy_request']
            );
            notificationId = result.rows[0].id;
        });

        it('should mark notification as read', async () => {
            const response = await request(app)
                .put(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.is_read).toBe(true);
        });

        it('should not allow marking other users notifications', async () => {
            const response = await request(app)
                .put(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should handle non-existent notification', async () => {
            const response = await request(app)
                .put('/api/notifications/999999/read')
                .set('Authorization', `Bearer ${token1}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should require authentication', async () => {
            await request(app)
                .put(`/api/notifications/${notificationId}/read`)
                .expect(401);
        });
    });

    describe('PUT /api/notifications/mark-all-read', () => {
        beforeEach(async () => {
            // Create multiple unread notifications
            for (let i = 0; i < 5; i++) {
                await query(
                    `INSERT INTO notifications (user_id, title, message, notification_type)
                        VALUES ($1, $2, $3, $4)`,
                    [user1.id, `Notification ${i}`, 'Test', 'system']
                );
            }
        });

        it('should mark all notifications as read', async () => {
            const response = await request(app)
                .put('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedCount).toBe(5);

            // Verify all are marked as read
            const result = await query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
                [user1.id]
            );

            expect(parseInt(result.rows[0].count)).toBe(0);
        });

        it('should handle when no unread notifications', async () => {
            // Mark all as read first
            await request(app)
                .put('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${token1}`);

            // Try again
            const response = await request(app)
                .put('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.data.updatedCount).toBe(0);
        });

        it('should require authentication', async () => {
            await request(app)
                .put('/api/notifications/mark-all-read')
                .expect(401);
        });
    });

    describe('DELETE /api/notifications/:id', () => {
        let notificationId: number;

        beforeEach(async () => {
            const result = await query(
                `INSERT INTO notifications (user_id, title, message, notification_type)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id`,
                [user1.id, 'Test Notification', 'Test message', 'buddy_request']
            );
            notificationId = result.rows[0].id;
        });

        it('should delete a notification', async () => {
            const response = await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');

            // Verify deletion
            const result = await query(
                'SELECT * FROM notifications WHERE id = $1',
                [notificationId]
            );

            expect(result.rows.length).toBe(0);
        });

        it('should not allow deleting other users notifications', async () => {
            const response = await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should require authentication', async () => {
            await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .expect(401);
        });
    });

    describe('DELETE /api/notifications/delete-all-read', () => {
        beforeEach(async () => {
            // Create 3 read and 2 unread notifications
            for (let i = 0; i < 3; i++) {
                await query(
                    `INSERT INTO notifications (user_id, title, message, notification_type, is_read)
                        VALUES ($1, $2, $3, $4, $5)`,
                    [user1.id, `Read ${i}`, 'Test', 'system', true]
                );
            }

            for (let i = 0; i < 2; i++) {
                await query(
                    `INSERT INTO notifications (user_id, title, message, notification_type)
                        VALUES ($1, $2, $3, $4)`,
                    [user1.id, `Unread ${i}`, 'Test', 'system']
                );
            }
        });

        it('should delete all read notifications', async () => {
            const response = await request(app)
                .delete('/api/notifications/delete-all-read')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(3);

            // Verify only unread remain
            const result = await query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
                [user1.id]
            );

            expect(parseInt(result.rows[0].count)).toBe(2);
        });

        it('should not delete unread notifications', async () => {
            await request(app)
                .delete('/api/notifications/delete-all-read')
                .set('Authorization', `Bearer ${token1}`);

            // Verify unread still exist
            const result = await query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
                [user1.id]
            );

            expect(parseInt(result.rows[0].count)).toBe(2);
        });

        it('should require authentication', async () => {
            await request(app)
                .delete('/api/notifications/delete-all-read')
                .expect(401);
        });
    });

    describe('Notification Integration Tests', () => {
        afterEach(async () => {
            // Clean up buddy relationships
            await query(
                'DELETE FROM buddies WHERE user_id IN ($1, $2) OR buddy_id IN ($1, $2)',
                [user1.id, user2.id]
            );
        });

        it('should create notification when buddy request is sent', async () => {
            // Send buddy request
            await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(201);

            // Check notification was created
            const notifications = await query(
                'SELECT * FROM notifications WHERE user_id = $1 AND notification_type = $2',
                [user2.id, 'buddy_request']
            );

            expect(notifications.rows.length).toBeGreaterThan(0);
            expect(notifications.rows[0].related_user_id).toBe(user1.id);
            expect(notifications.rows[0].action_url).toBe('/buddies');
        });

        it('should create notification when buddy request is accepted', async () => {
            // Send and accept request
            const reqResponse = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });

            await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId: reqResponse.body.data.id });

            // Check notification was created for original requester
            const notifications = await query(
                'SELECT * FROM notifications WHERE user_id = $1 AND notification_type = $2',
                [user1.id, 'buddy_accepted']
            );

            expect(notifications.rows.length).toBeGreaterThan(0);
            expect(notifications.rows[0].related_user_id).toBe(user2.id);
        });

        it('should create notification when recommendation is liked', async () => {
            // Like a recommendation
            await request(app)
                .post(`/api/recommendations/${recommendation.id}/like`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            // Check notification was created for recommendation owner
            const notifications = await query(
                'SELECT * FROM notifications WHERE user_id = $1 AND notification_type = $2',
                [recommendation.user_id, 'recommendation_like']
            );

            expect(notifications.rows.length).toBeGreaterThan(0);
            expect(notifications.rows[0].related_user_id).toBe(user1.id);
        });

        it('should create notification when recommendation is rated', async () => {
            // Rate a recommendation
            await request(app)
                .post(`/api/recommendations/${recommendation.id}/rate`)
                .set('Authorization', `Bearer ${token1}`)
                .send({ rating: 5 })
                .expect(200);

            // Check notification was created
            const notifications = await query(
                'SELECT * FROM notifications WHERE user_id = $1 AND notification_type = $2',
                [recommendation.user_id, 'recommendation_rating']
            );

            expect(notifications.rows.length).toBeGreaterThan(0);
            expect(notifications.rows[0].related_user_id).toBe(user1.id);
        });

        it('should not create notification if user likes own recommendation', async () => {
            // User should not receive notification for their own action
            const ownRec = await createTestRecommendation(user1.id);
            
            const initialCount = await query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
                [user1.id]
            );

            await request(app)
                .post(`/api/recommendations/${ownRec.id}/like`)
                .set('Authorization', `Bearer ${token1}`);

            const finalCount = await query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
                [user1.id]
            );

            // Count should be the same (no new notification)
            expect(finalCount.rows[0].count).toBe(initialCount.rows[0].count);
        });
    });
});
