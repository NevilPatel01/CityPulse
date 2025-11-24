import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import { generateTestToken } from '../setup';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { generateTestId, generateAlphanumericTestId } from '../helpers/test-helpers';

describe('Travel Preferences API Tests', () => {
    const app = createApp();
    let testUser: any;
    let authToken: string;
    const testId = generateTestId();
    const alphaTestId = generateAlphanumericTestId();

    beforeAll(async () => {
        // Create test user
        const userResult = await query(
            `INSERT INTO users (username, email, password_hash, full_name, email_verified)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email`,
            [
                `testuser_${alphaTestId}`,
                `test_${testId}@example.com`,
                '$2b$10$testhash',
                `Test User ${testId}`,
                true
            ]
        );
        testUser = userResult.rows[0];
        authToken = generateTestToken(testUser.id);
    });

    afterAll(async () => {
        // Clean up
        await query('DELETE FROM travel_preferences WHERE user_id = $1', [testUser.id]);
        await query('DELETE FROM users WHERE id = $1', [testUser.id]);
    });

    describe('GET /api/profile/travel-preferences', () => {
        it('should return default preferences if none exist', async () => {
            const response = await request(app)
                .get('/api/profile/travel-preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                travel_style: [],
                activity_level: 'moderate',
                preferred_difficulty: 'medium',
                interest_categories: []
            });
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/profile/travel-preferences')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token required');
        });
    });

    describe('PUT /api/profile/travel-preferences', () => {
        it('should create new preferences', async () => {
            const preferences = {
                travel_style: ['adventure', 'cultural'],
                activity_level: 'active',
                preferred_difficulty: 'medium',
                interest_categories: [1, 3, 5]
            };

            const response = await request(app)
                .put('/api/profile/travel-preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send(preferences)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Travel preferences updated successfully');

            // Verify in database
            const result = await query(
                'SELECT * FROM travel_preferences WHERE user_id = $1',
                [testUser.id]
            );
            expect(result.rows.length).toBe(1);
            expect(result.rows[0].travel_style).toEqual(preferences.travel_style);
            expect(result.rows[0].activity_level).toBe(preferences.activity_level);
        });

        it('should update existing preferences', async () => {
            const updatedPreferences = {
                travel_style: ['luxury', 'relaxation'],
                activity_level: 'relaxed',
                preferred_difficulty: 'easy',
                interest_categories: [2, 4]
            };

            const response = await request(app)
                .put('/api/profile/travel-preferences')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updatedPreferences)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify update
            const result = await query(
                'SELECT * FROM travel_preferences WHERE user_id = $1',
                [testUser.id]
            );
            expect(result.rows[0].travel_style).toEqual(updatedPreferences.travel_style);
            expect(result.rows[0].activity_level).toBe(updatedPreferences.activity_level);
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .put('/api/profile/travel-preferences')
                .send({ travel_style: ['adventure'] })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
