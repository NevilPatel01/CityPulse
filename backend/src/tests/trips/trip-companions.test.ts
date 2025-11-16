/**
 * Trip Companions Unit and E2E Tests
 * Tests for trip companion invitation, acceptance, decline, and removal functionality
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
import { describe, beforeAll, afterAll, afterEach, beforeEach, expect, it } from '@jest/globals';

const app = createApp();

describe('Trip Companions Management', () => {
    let organizer: any;
    let companion1: any;
    let companion2: any;
    let nonBuddy: any;
    let organizerToken: string;
    let companion1Token: string;
    let companion2Token: string;
    let nonBuddyToken: string;
    let testTrip: any;
    let testCity: any;

    beforeAll(async () => {
        // Create test users
        organizer = await createTestUser({ fullName: 'Trip Organizer', email: 'organizer@test.com' });
        companion1 = await createTestUser({ fullName: 'Companion One', email: 'companion1@test.com' });
        companion2 = await createTestUser({ fullName: 'Companion Two', email: 'companion2@test.com' });
        nonBuddy = await createTestUser({ fullName: 'Non Buddy', email: 'nonbuddy@test.com' });

        organizerToken = generateTestToken(organizer.id);
        companion1Token = generateTestToken(companion1.id);
        companion2Token = generateTestToken(companion2.id);
        nonBuddyToken = generateTestToken(nonBuddy.id);

        // Create test city
        const cityResult = await query(
            `INSERT INTO cities (name, country, latitude, longitude)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            ['Test City', 'Test Country', 40.7128, -74.0060]
        );
        testCity = cityResult.rows[0];
        testDataTracker.addCity(testCity.id);

        // Create buddy connections
        await query(
            `INSERT INTO travel_buddy_connections (requester_id, requested_id, status)
             VALUES ($1, $2, 'accepted'), ($1, $3, 'accepted')`,
            [organizer.id, companion1.id, companion2.id]
        );
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    beforeEach(async () => {
        // Create a test trip before each test
        const tripResult = await query(
            `INSERT INTO trips (user_id, title, description, start_date, end_date, privacy, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                organizer.id,
                'Test Trip',
                'A test trip for companions',
                '2025-12-01',
                '2025-12-10',
                'buddies_only',
                'planning'
            ]
        );
        testTrip = tripResult.rows[0];
        testDataTracker.addTrip(testTrip.id);

        // Add city to trip
        await query(
            `INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes)
                VALUES ($1, $2, $3, $4, $5, $6)`,
            [testTrip.id, testCity.id, '2025-12-01', '2025-12-10', 1, 'Test notes']
        );
    });

    afterEach(async () => {
        // Clean up trip companions and notifications
        if (testTrip) {
            await query('DELETE FROM trip_companions WHERE trip_id = $1', [testTrip.id]);
            await query('DELETE FROM notifications WHERE related_id = $1', [testTrip.id]);
            await query('DELETE FROM trip_cities WHERE trip_id = $1', [testTrip.id]);
            await query('DELETE FROM trips WHERE id = $1', [testTrip.id]);
        }
    });

    describe('POST /api/trips/:id/companions', () => {
        it('should allow organizer to invite a buddy', async () => {
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: companion1.id })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('invited');
            expect(response.body.data.user_id).toBe(companion1.id);
            expect(response.body.data.status).toBe('invited');
            expect(response.body.data.role).toBe('participant');
        });

        it('should send notification when inviting companion', async () => {
            await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: companion1.id })
                .expect(201);

            // Check notification was created
            const notifResult = await query(
                `SELECT * FROM notifications WHERE user_id = $1 AND notification_type = 'trip_invite' AND related_id = $2`,
                [companion1.id, testTrip.id]
            );

            expect(notifResult.rows.length).toBe(1);
            expect(notifResult.rows[0].message).toContain('Test Trip');
            expect(notifResult.rows[0].action_url).toBe(`/trips/${testTrip.id}`);
        });

        it('should not allow non-organizer to invite companions', async () => {
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${companion1Token}`)
                .send({ companionId: companion2.id })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('organizer');
        });

        it('should not allow inviting to private trip', async () => {
            // Update trip to private
            await query('UPDATE trips SET privacy = $1 WHERE id = $2', ['private', testTrip.id]);

            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: companion1.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Cannot invite');
        });

        it('should not allow duplicate invitations', async () => {
            // First invitation
            await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: companion1.id })
                .expect(201);

            // Duplicate invitation
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: companion1.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already');
        });

        it('should not allow inviting non-buddy to buddies_only trip', async () => {
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: nonBuddy.id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('buddies');
        });
    });

    describe('PUT /api/trips/:id/companions/respond', () => {
        beforeEach(async () => {
            // Create invitation before each test
            await query(
                `INSERT INTO trip_companions (trip_id, user_id, role, status)
                 VALUES ($1, $2, 'participant', 'invited')`,
                [testTrip.id, companion1.id]
            );
        });

        it('should allow invited user to accept invitation', async () => {
            const response = await request(app)
                .put(`/api/trips/${testTrip.id}/companions/respond`)
                .set('Authorization', `Bearer ${companion1Token}`)
                .send({ status: 'accepted' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('accepted');

            // Check notification was sent to organizer
            const notifResult = await query(
                `SELECT * FROM notifications WHERE user_id = $1 AND notification_type = 'trip_accepted'`,
                [organizer.id]
            );
            expect(notifResult.rows.length).toBe(1);
        });

        it('should allow invited user to decline invitation', async () => {
            const response = await request(app)
                .put(`/api/trips/${testTrip.id}/companions/respond`)
                .set('Authorization', `Bearer ${companion1Token}`)
                .send({ status: 'declined' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('declined');
        });

        it('should not allow non-invited user to respond', async () => {
            const response = await request(app)
                .put(`/api/trips/${testTrip.id}/companions/respond`)
                .set('Authorization', `Bearer ${companion2Token}`)
                .send({ status: 'accepted' })
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should not allow responding with invalid status', async () => {
            const response = await request(app)
                .put(`/api/trips/${testTrip.id}/companions/respond`)
                .set('Authorization', `Bearer ${companion1Token}`)
                .send({ status: 'invalid' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/trips/:id/companions/:companionId', () => {
        beforeEach(async () => {
            // Create accepted companion
            await query(
                `INSERT INTO trip_companions (trip_id, user_id, role, status)
                 VALUES ($1, $2, 'participant', 'accepted')`,
                [testTrip.id, companion1.id]
            );
        });

        it('should allow organizer to remove companion', async () => {
            const response = await request(app)
                .delete(`/api/trips/${testTrip.id}/companions/${companion1.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Check notification was sent
            const notifResult = await query(
                `SELECT * FROM notifications WHERE user_id = $1 AND notification_type = 'trip_removed'`,
                [companion1.id]
            );
            expect(notifResult.rows.length).toBe(1);
        });

        it('should allow companion to remove themselves', async () => {
            const response = await request(app)
                .delete(`/api/trips/${testTrip.id}/companions/${companion1.id}`)
                .set('Authorization', `Bearer ${companion1Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // No notification should be sent for self-removal
            const notifResult = await query(
                `SELECT * FROM notifications WHERE user_id = $1 AND notification_type = 'trip_removed'`,
                [companion1.id]
            );
            expect(notifResult.rows.length).toBe(0);
        });

        it('should not allow non-organizer to remove other companions', async () => {
            // Add second companion
            await query(
                `INSERT INTO trip_companions (trip_id, user_id, role, status)
                 VALUES ($1, $2, 'participant', 'accepted')`,
                [testTrip.id, companion2.id]
            );

            const response = await request(app)
                .delete(`/api/trips/${testTrip.id}/companions/${companion2.id}`)
                .set('Authorization', `Bearer ${companion1Token}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Security Tests', () => {
        it('should require authentication for all companion endpoints', async () => {
            await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .send({ companionId: companion1.id })
                .expect(401);

            await request(app)
                .put(`/api/trips/${testTrip.id}/companions/respond`)
                .send({ status: 'accepted' })
                .expect(401);

            await request(app)
                .delete(`/api/trips/${testTrip.id}/companions/${companion1.id}`)
                .expect(401);
        });

        it('should validate companionId exists', async () => {
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: 99999 })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should not allow SQL injection in companionId', async () => {
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({ companionId: "1; DROP TABLE trips;--" });

            expect([400, 500]).toContain(response.status);
            expect(response.body.success).toBe(false);

            // Verify trips table still exists
            const tripCheck = await query('SELECT COUNT(*) FROM trips');
            expect(parseInt(tripCheck.rows[0].count)).toBeGreaterThan(0);
        });
    });

    describe('Trip Feed Privacy with Companions', () => {
        it('should show buddies_only trip to accepted companions in feed', async () => {
            // Accept invitation
            await query(
                `INSERT INTO trip_companions (trip_id, user_id, role, status)
                 VALUES ($1, $2, 'participant', 'accepted')`,
                [testTrip.id, companion1.id]
            );

            const response = await request(app)
                .get('/api/feed?page=1&limit=20')
                .set('Authorization', `Bearer ${companion1Token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const trips = response.body.data.filter((item: any) => item.content_type === 'trip');
            const foundTrip = trips.find((t: any) => t.id === testTrip.id);
            expect(foundTrip).toBeDefined();
        });

        it('should not show buddies_only trip to non-companions', async () => {
            const response = await request(app)
                .get('/api/feed?page=1&limit=20')
                .set('Authorization', `Bearer ${nonBuddyToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const trips = response.body.data.filter((item: any) => item.content_type === 'trip');
            const foundTrip = trips.find((t: any) => t.id === testTrip.id);
            expect(foundTrip).toBeUndefined();
        });

        it('should show public trip to all users', async () => {
            // Update trip to public
            await query('UPDATE trips SET privacy = $1 WHERE id = $2', ['public', testTrip.id]);

            const response = await request(app)
                .get('/api/feed?page=1&limit=20')
                .set('Authorization', `Bearer ${nonBuddyToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const trips = response.body.data.filter((item: any) => item.content_type === 'trip');
            const foundTrip = trips.find((t: any) => t.id === testTrip.id);
            expect(foundTrip).toBeDefined();
        });

        it('should only show private trip to organizer', async () => {
            // Update trip to private
            await query('UPDATE trips SET privacy = $1 WHERE id = $2', ['private', testTrip.id]);

            // Organizer should see it
            const organizerResponse = await request(app)
                .get('/api/feed?page=1&limit=20')
                .set('Authorization', `Bearer ${organizerToken}`)
                .expect(200);

            const organizerTrips = organizerResponse.body.data.filter((item: any) => item.content_type === 'trip');
            const foundByOrganizer = organizerTrips.find((t: any) => t.id === testTrip.id);
            expect(foundByOrganizer).toBeDefined();

            // Buddy should not see it
            const buddyResponse = await request(app)
                .get('/api/feed?page=1&limit=20')
                .set('Authorization', `Bearer ${companion1Token}`)
                .expect(200);

            const buddyTrips = buddyResponse.body.data.filter((item: any) => item.content_type === 'trip');
            const foundByBuddy = buddyTrips.find((t: any) => t.id === testTrip.id);
            expect(foundByBuddy).toBeUndefined();
        });
    });
});
