/**
 * Buddy System Unit Tests
 * Tests for buddy request, acceptance, blocking, and management functionality
 */

import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    generateTestToken,
    cleanupAllTestData,
} from '../helpers/test-helpers';
import { describe, beforeAll, afterAll, afterEach, beforeEach, expect, it } from '@jest/globals';


const app = createApp();
describe('Buddy System', () => {
    let user1: any;
    let user2: any;
    let user3: any;
    let token1: string;
    let token2: string;
    let token3: string;

    beforeAll(async () => {
        // Create test users
        user1 = await createTestUser({ fullName: 'User One' });
        user2 = await createTestUser({ fullName: 'User Two' });
        user3 = await createTestUser({ fullName: 'User Three' });

        token1 = generateTestToken(user1.id);
        token2 = generateTestToken(user2.id);
        token3 = generateTestToken(user3.id);
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    afterEach(async () => {
        // Clean up buddy relationships after each test
        await query(
            'DELETE FROM travel_buddy_connections WHERE requester_id IN ($1, $2, $3) OR requested_id IN ($1, $2, $3)',
            [user1.id, user2.id, user3.id]
        );
        await query(
            'DELETE FROM user_blocks WHERE blocker_id IN ($1, $2, $3) OR blocked_id IN ($1, $2, $3)',
            [user1.id, user2.id, user3.id]
        );
    });

    describe('POST /api/buddies/request', () => {
        it('should send a buddy request successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('sent');
            expect(response.body.data.request).toHaveProperty('id');
            expect(response.body.data.request.requester_id).toBe(user1.id);
            expect(response.body.data.request.requested_id).toBe(user2.id);
            expect(response.body.data.request.status).toBe('pending');
        });

        it('should not allow sending request to yourself', async () => {
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user1.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid target user');
        });

        it('should not allow duplicate buddy requests', async () => {
            // Send first request
            await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(201);

            // Try to send duplicate
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already');
        });

        it('should not allow sending request to blocked user', async () => {
            // User1 blocks User2
            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(200);

            // Try to send request
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require authentication', async () => {
            await request(app)
                .post('/api/buddies/request')
                .send({ targetUserId: user2.id })
                .expect(401);
        });

        it('should validate targetUserId is required', async () => {
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({})
                .expect(400);

            expect(response.body.message).toContain('Invalid target user');
        });
    });

    describe('POST /api/buddies/requests/:requestId/accept', () => {
        let requestId: number;

        beforeEach(async () => {
            // User1 sends request to User2
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });
            
            requestId = response.body.data.request.id;
        });

        it('should accept a buddy request successfully', async () => {
            const response = await request(app)
                .post(`/api/buddies/requests/${requestId}/accept`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('accepted');
        });

        it('should create buddy relationship', async () => {
            await request(app)
                .post(`/api/buddies/requests/${requestId}/accept`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            // Check relationship exists
            const result = await query(
                `SELECT * FROM travel_buddy_connections 
                    WHERE requester_id = $1 AND requested_id = $2 AND status = 'accepted'`,
                [user1.id, user2.id]
            );

            expect(result.rows.length).toBe(1);
        });

        it('should not allow accepting own request', async () => {
            const response = await request(app)
                .post(`/api/buddies/requests/${requestId}/accept`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should not allow accepting non-existent request', async () => {
            const response = await request(app)
                .post(`/api/buddies/requests/999999/accept`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/buddies/requests/:requestId/decline', () => {
        let requestId: number;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });
            
            requestId = response.body.data.request.id;
        });

        it('should decline a buddy request successfully', async () => {
            const response = await request(app)
                .post(`/api/buddies/requests/${requestId}/decline`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('declined');
        });

        it('should update request status to declined', async () => {
            await request(app)
                .post(`/api/buddies/requests/${requestId}/decline`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            const result = await query(
                'SELECT * FROM travel_buddy_connections WHERE id = $1',
                [requestId]
            );

            expect(result.rows.length).toBe(1);
            expect(result.rows[0].status).toBe('declined');
        });
    });

    describe('DELETE /api/buddies/requests/:requestId', () => {
        let requestId: number;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });
            
            requestId = response.body.data.request.id;
        });

        it('should cancel a sent buddy request successfully', async () => {
            const response = await request(app)
                .delete(`/api/buddies/requests/${requestId}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('cancel');
        });

        it('should not allow canceling other users requests', async () => {
            const response = await request(app)
                .delete(`/api/buddies/requests/${requestId}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/buddies/:buddyId', () => {
        beforeEach(async () => {
            // Create accepted buddy relationship
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });

            await request(app)
                .post(`/api/buddies/requests/${response.body.data.request.id}/accept`)
                .set('Authorization', `Bearer ${token2}`);
        });

        it('should remove a buddy successfully', async () => {
            const response = await request(app)
                .delete(`/api/buddies/${user2.id}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('removed');
        });

        it('should remove buddy relationship from database', async () => {
            await request(app)
                .delete(`/api/buddies/${user2.id}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const result = await query(
                `SELECT * FROM travel_buddy_connections 
                    WHERE (requester_id = $1 AND requested_id = $2)
                    OR (requester_id = $2 AND requested_id = $1)`,
                [user1.id, user2.id]
            );

            expect(result.rows.length).toBe(0);
        });
    });

    describe('GET /api/buddies', () => {
        beforeEach(async () => {
            // User1 and User2 are buddies
            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });

            await request(app)
                .post(`/api/buddies/requests/${response.body.data.request.id}/accept`)
                .set('Authorization', `Bearer ${token2}`);
        });

        it('should get list of buddies', async () => {
            const response = await request(app)
                .get('/api/buddies')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.buddies)).toBe(true);
            expect(response.body.data.buddies.length).toBeGreaterThanOrEqual(1);
            const buddy = response.body.data.buddies.find((b: any) => b.id === user2.id);
            expect(buddy).toBeDefined();
            expect(buddy).toHaveProperty('full_name');
            expect(buddy).toHaveProperty('username');
        });

        it('should return empty array when no buddies', async () => {
            const response = await request(app)
                .get('/api/buddies')
                .set('Authorization', `Bearer ${token3}`)
                .expect(200);

            expect(response.body.data.buddies).toEqual([]);
        });
    });

    describe('GET /api/buddies/requests/received', () => {
        beforeEach(async () => {
            // User1 sends request to User2
            await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });
        });

        it('should get received buddy requests', async () => {
            const response = await request(app)
                .get('/api/buddies/requests/received')
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.requests)).toBe(true);
            expect(response.body.data.requests.length).toBeGreaterThanOrEqual(1);
            const request_item = response.body.data.requests.find((r: any) => r.requester_id === user1.id);
            expect(request_item).toBeDefined();
            expect(request_item.status).toBe('pending');
        });
    });

    describe('GET /api/buddies/requests/sent', () => {
        beforeEach(async () => {
            // User1 sends request to User2
            await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });
        });

        it('should get sent buddy requests', async () => {
            const response = await request(app)
                .get('/api/buddies/requests/sent')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.requests)).toBe(true);
            expect(response.body.data.requests.length).toBeGreaterThanOrEqual(1);
            const request_item = response.body.data.requests.find((r: any) => r.requested_id === user2.id);
            expect(request_item).toBeDefined();
            expect(request_item.status).toBe('pending');
        });
    });

    describe('POST /api/buddies/block', () => {
        it('should block a user successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('blocked');
        });

        it('should remove existing buddy relationship when blocking', async () => {
            // Create buddy relationship first
            const reqResponse = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });

            await request(app)
                .post(`/api/buddies/requests/${reqResponse.body.data.request.id}/accept`)
                .set('Authorization', `Bearer ${token2}`);

            // Now block
            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(200);

            // Verify buddy relationship is removed
            const buddyResult = await query(
                `SELECT * FROM travel_buddy_connections 
                WHERE (requester_id = $1 AND requested_id = $2)
                    OR (requester_id = $2 AND requested_id = $1)`,
                [user1.id, user2.id]
            );

            expect(buddyResult.rows.length).toBe(0);
        });

        it('should not allow blocking yourself', async () => {
            const response = await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user1.id })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/buddies/block/:targetUserId', () => {
        beforeEach(async () => {
            // Block user first
            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });
        });

        it('should unblock a user successfully', async () => {
            const response = await request(app)
                .delete(`/api/buddies/block/${user2.id}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('unblocked');
        });

        it('should remove block from database', async () => {
            await request(app)
                .delete(`/api/buddies/block/${user2.id}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const result = await query(
                'SELECT * FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
                [user1.id, user2.id]
            );

            expect(result.rows.length).toBe(0);
        });
    });

    describe('GET /api/buddies/blocked', () => {
        beforeEach(async () => {
            // Block User2 and User3
            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id });

            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user3.id });
        });

        it('should get list of blocked users', async () => {
            const response = await request(app)
                .get('/api/buddies/blocked')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.blockedUsers)).toBe(true);
            expect(response.body.data.blockedUsers.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('POST /api/buddies/report', () => {
        it('should report a user successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/report')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    targetUserId: user2.id,
                    reportReason: 'spam',
                    description: 'Sending spam messages'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('report');
        });

        it('should require reportReason', async () => {
            const response = await request(app)
                .post('/api/buddies/report')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    targetUserId: user2.id,
                    description: 'Test'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('required');
        });

        it('should require targetUserId', async () => {
            const response = await request(app)
                .post('/api/buddies/report')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    reportReason: 'spam',
                    description: 'Test'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('required');
        });
    });

    describe('Privacy Settings Integration', () => {
        it('should not allow buddy request when buddy_requests_enabled is false', async () => {
            // Disable buddy requests for User2
            await query(
                `UPDATE user_profiles 
                    SET travel_buddy_requests_enabled = false 
                    WHERE user_id = $1`,
                [user2.id]
            );

            const response = await request(app)
                .post('/api/buddies/request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ targetUserId: user2.id })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('not accepting');
        });
    });
});
