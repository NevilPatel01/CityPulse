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
    testDataTracker
} from '../helpers/test-helpers';


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
            'DELETE FROM buddies WHERE user_id IN ($1, $2, $3) OR buddy_id IN ($1, $2, $3)',
            [user1.id, user2.id, user3.id]
        );
        await query(
            'DELETE FROM user_blocks WHERE blocker_id IN ($1, $2, $3) OR blocked_id IN ($1, $2, $3)',
            [user1.id, user2.id, user3.id]
        );
    });

    describe('POST /api/buddies/send-request', () => {
        it('should send a buddy request successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Buddy request sent');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.user_id).toBe(user1.id);
            expect(response.body.data.buddy_id).toBe(user2.id);
            expect(response.body.data.status).toBe('pending');
        });

        it('should not allow sending request to yourself', async () => {
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user1.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('cannot send');
        });

        it('should not allow duplicate buddy requests', async () => {
            // Send first request
            await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(201);

            // Try to send duplicate
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });

        it('should not allow sending request to blocked user', async () => {
            // User1 blocks User2
            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user2.id })
                .expect(200);

            // Try to send request
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require authentication', async () => {
            await request(app)
                .post('/api/buddies/send-request')
                .send({ buddyId: user2.id })
                .expect(401);
        });

        it('should validate buddyId is required', async () => {
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({})
                .expect(400);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('POST /api/buddies/accept-request', () => {
        let requestId: number;

        beforeEach(async () => {
            // User1 sends request to User2
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });
            
            requestId = response.body.data.id;
        });

        it('should accept a buddy request successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('accepted');
            expect(response.body.data.status).toBe('accepted');
        });

        it('should create reciprocal buddy relationship', async () => {
            await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId })
                .expect(200);

            // Check both directions exist
            const result = await query(
                `SELECT * FROM buddies 
                 WHERE (user_id = $1 AND buddy_id = $2 AND status = 'accepted')
                    OR (user_id = $2 AND buddy_id = $1 AND status = 'accepted')`,
                [user1.id, user2.id]
            );

            expect(result.rows.length).toBe(2);
        });

        it('should not allow accepting own request', async () => {
            const response = await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ requestId })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not allow accepting non-existent request', async () => {
            const response = await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId: 999999 })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/buddies/decline-request', () => {
        let requestId: number;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });
            
            requestId = response.body.data.id;
        });

        it('should decline a buddy request successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/decline-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('declined');
        });

        it('should delete the request from database', async () => {
            await request(app)
                .post('/api/buddies/decline-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId })
                .expect(200);

            const result = await query(
                'SELECT * FROM buddies WHERE id = $1',
                [requestId]
            );

            expect(result.rows.length).toBe(0);
        });
    });

    describe('POST /api/buddies/cancel-request', () => {
        let requestId: number;

        beforeEach(async () => {
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });
            
            requestId = response.body.data.id;
        });

        it('should cancel a sent buddy request successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/cancel-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ requestId })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('cancelled');
        });

        it('should not allow canceling other users requests', async () => {
            const response = await request(app)
                .post('/api/buddies/cancel-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/buddies/:buddyId', () => {
        beforeEach(async () => {
            // Create accepted buddy relationship
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });

            await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId: response.body.data.id });
        });

        it('should remove a buddy successfully', async () => {
            const response = await request(app)
                .delete(`/api/buddies/${user2.id}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('removed');
        });

        it('should remove both directions of buddy relationship', async () => {
            await request(app)
                .delete(`/api/buddies/${user2.id}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const result = await query(
                `SELECT * FROM buddies 
                 WHERE (user_id = $1 AND buddy_id = $2)
                    OR (user_id = $2 AND buddy_id = $1)`,
                [user1.id, user2.id]
            );

            expect(result.rows.length).toBe(0);
        });
    });

    describe('GET /api/buddies', () => {
        beforeEach(async () => {
            // User1 and User2 are buddies
            const response = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });

            await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId: response.body.data.id });
        });

        it('should get list of buddies', async () => {
            const response = await request(app)
                .get('/api/buddies')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0]).toHaveProperty('id');
            expect(response.body.data[0]).toHaveProperty('full_name');
            expect(response.body.data[0]).toHaveProperty('username');
        });

        it('should return empty array when no buddies', async () => {
            const response = await request(app)
                .get('/api/buddies')
                .set('Authorization', `Bearer ${token3}`)
                .expect(200);

            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /api/buddies/requests/received', () => {
        beforeEach(async () => {
            // User1 sends request to User2
            await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });
        });

        it('should get received buddy requests', async () => {
            const response = await request(app)
                .get('/api/buddies/requests/received')
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].status).toBe('pending');
            expect(response.body.data[0]).toHaveProperty('requester_name');
        });
    });

    describe('GET /api/buddies/requests/sent', () => {
        beforeEach(async () => {
            // User1 sends request to User2
            await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });
        });

        it('should get sent buddy requests', async () => {
            const response = await request(app)
                .get('/api/buddies/requests/sent')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].status).toBe('pending');
            expect(response.body.data[0]).toHaveProperty('receiver_name');
        });
    });

    describe('POST /api/buddies/block', () => {
        it('should block a user successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user2.id })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('blocked');
        });

        it('should remove existing buddy relationship when blocking', async () => {
            // Create buddy relationship first
            const reqResponse = await request(app)
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id });

            await request(app)
                .post('/api/buddies/accept-request')
                .set('Authorization', `Bearer ${token2}`)
                .send({ requestId: reqResponse.body.data.id });

            // Now block
            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user2.id })
                .expect(200);

            // Verify buddy relationship is removed
            const buddyResult = await query(
                `SELECT * FROM buddies 
                 WHERE (user_id = $1 AND buddy_id = $2)
                    OR (user_id = $2 AND buddy_id = $1)`,
                [user1.id, user2.id]
            );

            expect(buddyResult.rows.length).toBe(0);
        });

        it('should not allow blocking yourself', async () => {
            const response = await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user1.id })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/buddies/unblock', () => {
        beforeEach(async () => {
            // Block user first
            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user2.id });
        });

        it('should unblock a user successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/unblock')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user2.id })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('unblocked');
        });

        it('should remove block from database', async () => {
            await request(app)
                .post('/api/buddies/unblock')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user2.id })
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
                .send({ userId: user2.id });

            await request(app)
                .post('/api/buddies/block')
                .set('Authorization', `Bearer ${token1}`)
                .send({ userId: user3.id });
        });

        it('should get list of blocked users', async () => {
            const response = await request(app)
                .get('/api/buddies/blocked')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0]).toHaveProperty('full_name');
            expect(response.body.data[0]).toHaveProperty('username');
        });
    });

    describe('POST /api/buddies/report', () => {
        it('should report a user successfully', async () => {
            const response = await request(app)
                .post('/api/buddies/report')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    userId: user2.id,
                    reason: 'spam',
                    description: 'Sending spam messages'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('reported');
        });

        it('should require a reason', async () => {
            const response = await request(app)
                .post('/api/buddies/report')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    userId: user2.id,
                    description: 'Test'
                })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });

        it('should validate reason is one of allowed values', async () => {
            const response = await request(app)
                .post('/api/buddies/report')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    userId: user2.id,
                    reason: 'invalid_reason',
                    description: 'Test'
                })
                .expect(400);

            expect(response.body.error).toBeDefined();
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
                .post('/api/buddies/send-request')
                .set('Authorization', `Bearer ${token1}`)
                .send({ buddyId: user2.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not accepting');
        });
    });
});
