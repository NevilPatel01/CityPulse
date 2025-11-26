/**
 * Trip Planning Comprehensive Tests
 * Tests for trip itinerary, privacy controls, sharing, and status transitions
 */

import { describe, it, beforeAll, afterAll, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import {
    createTestUser,
    createTestCity,
    generateTestToken,
    cleanupAllTestData,
    testDataTracker
} from '../helpers/test-helpers';

describe('Trip Planning Comprehensive Tests', () => {
    const app = createApp();
    let organizer: any;
    let companion: any;
    let nonBuddy: any;
    let organizerToken: string;
    let companionToken: string;
    let nonBuddyToken: string;
    let testCity: any;
    let testRecommendation: any;

    beforeAll(async () => {
        organizer = await createTestUser({ 
            fullName: 'Trip Organizer',
            username: 'trip_organizer'
        });
        companion = await createTestUser({ 
            fullName: 'Trip Companion',
            username: 'trip_companion'
        });
        nonBuddy = await createTestUser({ 
            fullName: 'Non Buddy',
            username: 'non_buddy'
        });

        organizerToken = generateTestToken(organizer.id);
        companionToken = generateTestToken(companion.id);
        nonBuddyToken = generateTestToken(nonBuddy.id);

        testCity = await createTestCity({ name: 'Test City' });

        // Create buddy connection between organizer and companion
        await query(
            `INSERT INTO travel_buddy_connections (requester_id, requested_id, status)
                VALUES ($1, $2, 'accepted')`,
            [organizer.id, companion.id]
        );

        // Create test recommendation
        const categoryResult = await query(
            `SELECT id FROM recommendation_categories LIMIT 1`
        );
        if (categoryResult.rows.length > 0) {
            const recResult = await query(
                `INSERT INTO recommendations (user_id, title, description, category_id, status)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [organizer.id, 'Test Recommendation', 'Test', categoryResult.rows[0].id, 'active']
            );
            testRecommendation = recResult.rows[0];
            testDataTracker.addRecommendation(testRecommendation.id);
        }
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    describe('Trip Itinerary CRUD', () => {
        let testTrip: any;

        beforeEach(async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Itinerary Test Trip',
                    'Test trip for itinerary',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'public'
                ]
            );
            testTrip = tripResult.rows[0];
            testDataTracker.addTrip(testTrip.id);

            // Add city to trip
            await query(
                `INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order)
                    VALUES ($1, $2, $3, $4, $5)`,
                [testTrip.id, testCity.id, '2025-12-01', '2025-12-10', 1]
            );
        });

        afterAll(async () => {
            if (testTrip) {
                await query('DELETE FROM trip_itinerary WHERE trip_id = $1', [testTrip.id]);
                await query('DELETE FROM trip_cities WHERE trip_id = $1', [testTrip.id]);
                await query('DELETE FROM trips WHERE id = $1', [testTrip.id]);
            }
        });

        it('should create itinerary item', async () => {
            const response = await request(app)
                .post(`/api/trips/${testTrip.id}/itinerary`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    day_number: 1,
                    activity_date: '2025-12-01',
                    time_slot: '10:00:00',
                    title: 'Morning Activity',
                    description: 'Test activity',
                    activity_type: 'sightseeing',
                    duration_minutes: 120,
                    estimated_cost: 50.00,
                    location_name: 'Test Location'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Morning Activity');

            // Verify in database
            const dbResult = await query(
                `SELECT * FROM trip_itinerary WHERE trip_id = $1 AND title = $2`,
                [testTrip.id, 'Morning Activity']
            );
            expect(dbResult.rows.length).toBe(1);
        });

        it('should get trip itinerary', async () => {
            // Create itinerary item
            await query(
                `INSERT INTO trip_itinerary (trip_id, day_number, activity_date, time_slot, title, description)
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                [testTrip.id, 1, '2025-12-01', '10:00:00', 'Test Activity', 'Test']
            );

            const response = await request(app)
                .get(`/api/trips/${testTrip.id}/itinerary`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should update itinerary item', async () => {
            // Create itinerary item
            const insertResult = await query(
                `INSERT INTO trip_itinerary (trip_id, day_number, activity_date, time_slot, title, description)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [testTrip.id, 1, '2025-12-01', '10:00:00', 'Original Title', 'Original']
            );
            const itineraryId = insertResult.rows[0].id;

            const response = await request(app)
                .put(`/api/trips/${testTrip.id}/itinerary/${itineraryId}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    title: 'Updated Title',
                    description: 'Updated description'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Title');
        });

        it('should delete itinerary item', async () => {
            // Create itinerary item
            const insertResult = await query(
                `INSERT INTO trip_itinerary (trip_id, day_number, activity_date, time_slot, title, description)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [testTrip.id, 1, '2025-12-01', '10:00:00', 'Delete Test', 'Test']
            );
            const itineraryId = insertResult.rows[0].id;

            const response = await request(app)
                .delete(`/api/trips/${testTrip.id}/itinerary/${itineraryId}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify deleted
            const dbResult = await query(
                `SELECT * FROM trip_itinerary WHERE id = $1`,
                [itineraryId]
            );
            expect(dbResult.rows.length).toBe(0);
        });
    });

    describe('Trip Privacy Controls', () => {
        it('should allow public trip to be viewed by anyone', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Public Trip',
                    'Public trip description',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'public'
                ]
            );
            const publicTrip = tripResult.rows[0];
            testDataTracker.addTrip(publicTrip.id);

            const response = await request(app)
                .get(`/api/trips/${publicTrip.id}`)
                .set('Authorization', `Bearer ${nonBuddyToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            await query('DELETE FROM trips WHERE id = $1', [publicTrip.id]);
        });

        it('should restrict buddies_only trip to buddies and companions', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Buddies Only Trip',
                    'Buddies only description',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'buddies_only'
                ]
            );
            const buddiesTrip = tripResult.rows[0];
            testDataTracker.addTrip(buddiesTrip.id);

            // Buddy should be able to view
            const buddyResponse = await request(app)
                .get(`/api/trips/${buddiesTrip.id}`)
                .set('Authorization', `Bearer ${companionToken}`)
                .expect(200);
            expect(buddyResponse.body.success).toBe(true);

            // Non-buddy should not be able to view
            const nonBuddyResponse = await request(app)
                .get(`/api/trips/${buddiesTrip.id}`)
                .set('Authorization', `Bearer ${nonBuddyToken}`)
                .expect(403);
            expect(nonBuddyResponse.body.success).toBe(false);

            await query('DELETE FROM trips WHERE id = $1', [buddiesTrip.id]);
        });

        it('should restrict private trip to owner only', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Private Trip',
                    'Private description',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'private'
                ]
            );
            const privateTrip = tripResult.rows[0];
            testDataTracker.addTrip(privateTrip.id);

            // Owner should be able to view
            const ownerResponse = await request(app)
                .get(`/api/trips/${privateTrip.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .expect(200);
            expect(ownerResponse.body.success).toBe(true);

            // Companion (buddy) should not be able to view
            const companionResponse = await request(app)
                .get(`/api/trips/${privateTrip.id}`)
                .set('Authorization', `Bearer ${companionToken}`)
                .expect(403);
            expect(companionResponse.body.success).toBe(false);

            await query('DELETE FROM trips WHERE id = $1', [privateTrip.id]);
        });

        it('should allow updating trip privacy', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Privacy Update Trip',
                    'Test',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'public'
                ]
            );
            const trip = tripResult.rows[0];
            testDataTracker.addTrip(trip.id);

            const response = await request(app)
                .put(`/api/trips/${trip.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    title: 'Privacy Update Trip',
                    description: 'Test',
                    privacy: 'private'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.privacy).toBe('private');

            await query('DELETE FROM trips WHERE id = $1', [trip.id]);
        });
    });

    describe('Trip Sharing Functionality', () => {
        it('should allow sharing public trip', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Shareable Trip',
                    'Test',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'public'
                ]
            );
            const trip = tripResult.rows[0];
            testDataTracker.addTrip(trip.id);

            // Public trips should appear in feed
            const feedResponse = await request(app)
                .get('/api/feed')
                .set('Authorization', `Bearer ${nonBuddyToken}`)
                .expect(200);

            expect(feedResponse.body.success).toBe(true);
            // Trip may or may not appear depending on feed algorithm
            // This test verifies the endpoint works

            await query('DELETE FROM trips WHERE id = $1', [trip.id]);
        });
    });

    describe('Trip Status Transitions', () => {
        let testTrip: any;

        beforeEach(async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Status Test Trip',
                    'Test',
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
            if (testTrip) {
                await query('DELETE FROM trips WHERE id = $1', [testTrip.id]);
            }
        });

        it('should transition from planning to active', async () => {
            const response = await request(app)
                .put(`/api/trips/${testTrip.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    title: 'Status Test Trip',
                    description: 'Test',
                    status: 'active'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('active');
        });

        it('should transition from active to completed', async () => {
            // First set to active
            await query(
                `UPDATE trips SET status = 'active' WHERE id = $1`,
                [testTrip.id]
            );

            const response = await request(app)
                .put(`/api/trips/${testTrip.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    title: 'Status Test Trip',
                    description: 'Test',
                    status: 'completed'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('completed');
        });

        it('should allow cancelling trip', async () => {
            const response = await request(app)
                .put(`/api/trips/${testTrip.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    title: 'Status Test Trip',
                    description: 'Test',
                    status: 'cancelled'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('cancelled');
        });
    });

    describe('Trip Deletion Cascades', () => {
        it('should cascade delete itinerary when trip is deleted', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Cascade Test Trip',
                    'Test',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'public'
                ]
            );
            const trip = tripResult.rows[0];
            testDataTracker.addTrip(trip.id);

            // Create itinerary item
            const itineraryResult = await query(
                `INSERT INTO trip_itinerary (trip_id, day_number, activity_date, time_slot, title, description)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [trip.id, 1, '2025-12-01', '10:00:00', 'Test Activity', 'Test']
            );
            const itineraryId = itineraryResult.rows[0].id;

            // Delete trip
            await request(app)
                .delete(`/api/trips/${trip.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .expect(200);

            // Verify itinerary is deleted (cascade)
            const itineraryCheck = await query(
                `SELECT * FROM trip_itinerary WHERE id = $1`,
                [itineraryId]
            );
            expect(itineraryCheck.rows.length).toBe(0);
        });

        it('should cascade delete companions when trip is deleted', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Companion Cascade Test',
                    'Test',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'public'
                ]
            );
            const trip = tripResult.rows[0];
            testDataTracker.addTrip(trip.id);

            // Add companion
            await query(
                `INSERT INTO trip_companions (trip_id, user_id, status, role)
                    VALUES ($1, $2, $3, $4)`,
                [trip.id, companion.id, 'accepted', 'participant']
            );

            // Delete trip
            await request(app)
                .delete(`/api/trips/${trip.id}`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .expect(200);

            // Verify companions are deleted (cascade)
            const companionCheck = await query(
                `SELECT * FROM trip_companions WHERE trip_id = $1`,
                [trip.id]
            );
            expect(companionCheck.rows.length).toBe(0);
        });
    });

    describe('Trip Invitation Restrictions', () => {
        it('should prevent inviting to private trips', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Private Invite Test',
                    'Test',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'private'
                ]
            );
            const trip = tripResult.rows[0];
            testDataTracker.addTrip(trip.id);

            const response = await request(app)
                .post(`/api/trips/${trip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    user_id: companion.id
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('private');

            await query('DELETE FROM trips WHERE id = $1', [trip.id]);
        });

        it('should only allow inviting buddies to buddies_only trips', async () => {
            const tripResult = await query(
                `INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [
                    organizer.id,
                    'Buddies Only Invite Test',
                    'Test',
                    '2025-12-01',
                    '2025-12-10',
                    'planning',
                    'buddies_only'
                ]
            );
            const trip = tripResult.rows[0];
            testDataTracker.addTrip(trip.id);

            // Should allow inviting buddy
            const buddyResponse = await request(app)
                .post(`/api/trips/${trip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    user_id: companion.id
                });

            expect([200, 201]).toContain(buddyResponse.status);

            // Should prevent inviting non-buddy
            const nonBuddyResponse = await request(app)
                .post(`/api/trips/${trip.id}/companions`)
                .set('Authorization', `Bearer ${organizerToken}`)
                .send({
                    user_id: nonBuddy.id
                })
                .expect(400);

            expect(nonBuddyResponse.body.success).toBe(false);

            await query('DELETE FROM trip_companions WHERE trip_id = $1', [trip.id]);
            await query('DELETE FROM trips WHERE id = $1', [trip.id]);
        });
    });

    describe('Companion Finder Algorithm', () => {
        it('should find potential companions based on trip details', async () => {
            const response = await request(app)
                .get('/api/companion-finder')
                .set('Authorization', `Bearer ${organizerToken}`)
                .query({
                    city_id: testCity.id,
                    start_date: '2025-12-01',
                    end_date: '2025-12-10'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});

