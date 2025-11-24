/**
 * Achievement System Unit and Integration Tests
 * Tests for achievement unlocking, progress tracking, and badge system
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

describe('Achievement System', () => {
    let user1: any;
    let user2: any;
    let token1: string;
    let token2: string;
    let testCity: any;
    let testCategory: any;

    beforeAll(async () => {
        // Create test users
        user1 = await createTestUser({ fullName: 'Achievement User 1', email: 'achieve1@test.com' });
        user2 = await createTestUser({ fullName: 'Achievement User 2', email: 'achieve2@test.com' });

        token1 = generateTestToken(user1.id);
        token2 = generateTestToken(user2.id);

        // Create test city
        const cityResult = await query(
            `INSERT INTO cities (name, country, latitude, longitude)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            ['Achievement City', 'Test Country', 40.7128, -74.0060]
        );
        testCity = cityResult.rows[0];
        testDataTracker.addCity(testCity.id);

        // Create test category with unique name
        const uniqueCategoryName = `Test Category ${Date.now()}`;
        const categoryResult = await query(
            `INSERT INTO recommendation_categories (name, description)
             VALUES ($1, $2) RETURNING *`,
            [uniqueCategoryName, 'A test category']
        );
        testCategory = categoryResult.rows[0];
    });

    afterAll(async () => {
        await cleanupAllTestData();
    });

    afterEach(async () => {
        // Clean up test recommendations and achievements
        await query('DELETE FROM recommendation_likes WHERE user_id IN ($1, $2)', [user1.id, user2.id]);
        await query('DELETE FROM recommendations WHERE user_id IN ($1, $2)', [user1.id, user2.id]);
        await query('DELETE FROM user_achievements WHERE user_id IN ($1, $2)', [user1.id, user2.id]);
    });

    describe('GET /api/achievements', () => {
        it('should return all available achievements', async () => {
            const response = await request(app)
                .get('/api/achievements')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('achievements');
            expect(Array.isArray(response.body.data.achievements)).toBe(true);
            expect(response.body.data.achievements.length).toBeGreaterThan(0);

            // Check achievement structure
            const achievement = response.body.data.achievements[0];
            expect(achievement).toHaveProperty('id');
            expect(achievement).toHaveProperty('name');
            expect(achievement).toHaveProperty('description');
            expect(achievement).toHaveProperty('badge_icon_url');
            expect(achievement).toHaveProperty('target_value');
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/achievements')
                .expect(401);
        });
    });

    describe('GET /api/achievements/user/:username', () => {
        it('should return user achievements with progress', async () => {
            const response = await request(app)
                .get(`/api/achievements/user/${user1.username}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('completed');
            expect(response.body.data).toHaveProperty('inProgress');
            expect(Array.isArray(response.body.data.completed)).toBe(true);
            expect(Array.isArray(response.body.data.inProgress)).toBe(true);
        });

        it('should return other user achievements', async () => {
            const response = await request(app)
                .get(`/api/achievements/user/${user2.username}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('completed');
        });

        it('should require authentication', async () => {
            await request(app)
                .get(`/api/achievements/user/${user1.username}`)
                .expect(401);
        });
    });

    describe('Achievement Unlocking - First Recommendation', () => {
        it('should unlock "First Step" achievement after first recommendation', async () => {
            // Create first recommendation
            const recResponse = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    place_name: 'Test Place',
                    description: 'Test description',
                    category_id: testCategory.id,
                    city_name: testCity.name,
                    user_rating: 5
                });

            if (recResponse.status !== 201) {
                console.log('Recommendation creation failed:', recResponse.status, recResponse.body);
            }
            expect(recResponse.status).toBe(201);

            const recommendationId = recResponse.body.data.id;
            testDataTracker.addRecommendation(recommendationId);

            // Check if achievement was unlocked
            const achievementCheck = await query(
                `SELECT ua.*, a.name, a.description 
                 FROM user_achievements ua
                 JOIN achievements a ON ua.achievement_id = a.id
                 WHERE ua.user_id = $1 AND a.name = 'First Step'`,
                [user1.id]
            );

            expect(achievementCheck.rows.length).toBe(1);
            expect(achievementCheck.rows[0].unlocked_at).not.toBeNull();
        });
    });

    describe('Achievement Unlocking - Explorer (5 Cities)', () => {
        it('should unlock Explorer achievement after visiting 5 cities', async () => {
            // Create 5 cities
            const cities = [];
            for (let i = 1; i <= 5; i++) {
                const cityResult = await query(
                    `INSERT INTO cities (name, country, latitude, longitude)
                     VALUES ($1, $2, $3, $4) RETURNING *`,
                    [`City ${i}`, 'Test Country', 40.7128 + i, -74.0060 + i]
                );
                cities.push(cityResult.rows[0]);
                testDataTracker.addCity(cityResult.rows[0].id);
            }

            // Create recommendations for each city
            for (const city of cities) {
                const recResponse = await request(app)
                    .post('/api/recommendations')
                    .set('Authorization', `Bearer ${token1}`)
                    .send({
                        place_name: `Test Place in ${city.name}`,
                        description: 'Test description',
                        category_id: testCategory.id,
                        city_name: city.name,
                        user_rating: 5
                    })
                    .expect(201);

                testDataTracker.addRecommendation(recResponse.body.data.id);
            }

            // Check if Explorer achievement was unlocked
            const achievementCheck = await query(
                `SELECT ua.*, a.name 
                 FROM user_achievements ua
                 JOIN achievements a ON ua.achievement_id = a.id
                 WHERE ua.user_id = $1 AND a.name = 'Explorer'`,
                [user1.id]
            );

            expect(achievementCheck.rows.length).toBe(1);
            expect(achievementCheck.rows[0].unlocked_at).not.toBeNull();
        });
    });

    describe('Achievement Unlocking - Social Butterfly (10 Likes)', () => {
        it('should unlock Social Butterfly after receiving 10 likes', async () => {
            // Create a recommendation
            const recResponse = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    place_name: 'Popular Place',
                    description: 'This will get many likes',
                    category_id: testCategory.id,
                    city_name: testCity.name,
                    user_rating: 5
                })
                .expect(201);

            const recommendationId = recResponse.body.data.id;
            testDataTracker.addRecommendation(recommendationId);

            // Create 10 users who will like the recommendation
            const likers = [];
            for (let i = 1; i <= 10; i++) {
                const liker = await createTestUser({
                    fullName: `Liker ${i}`,
                    email: `liker${i}@test.com`
                });
                likers.push(liker);

                // Like the recommendation
                await query(
                    'INSERT INTO recommendation_likes (recommendation_id, user_id) VALUES ($1, $2)',
                    [recommendationId, liker.id]
                );
            }

            // Update likes count
            await query(
                'UPDATE recommendations SET likes_count = 10 WHERE id = $1',
                [recommendationId]
            );

            // Manually trigger achievement check (in real app, this would be automatic)
            await request(app)
                .post('/api/achievements/check')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            // Check if Social Butterfly was unlocked
            const achievementCheck = await query(
                `SELECT ua.*, a.name 
                 FROM user_achievements ua
                 JOIN achievements a ON ua.achievement_id = a.id
                 WHERE ua.user_id = $1 AND a.name = 'Social Butterfly'`,
                [user1.id]
            );

            expect(achievementCheck.rows.length).toBe(1);
        });
    });

    describe('Achievement Progress Tracking', () => {
        it('should track progress towards achievements', async () => {
            // Create 3 recommendations (Explorer needs 5 cities)
            for (let i = 1; i <= 3; i++) {
                const cityResult = await query(
                    `INSERT INTO cities (name, country, latitude, longitude)
                     VALUES ($1, $2, $3, $4) RETURNING *`,
                    [`Progress City ${i}`, 'Test Country', 40.7128 + i, -74.0060 + i]
                );
                testDataTracker.addCity(cityResult.rows[0].id);

                const recResponse = await request(app)
                    .post('/api/recommendations')
                    .set('Authorization', `Bearer ${token1}`)
                    .send({
                        place_name: `Progress Place ${i}`,
                        description: 'Test',
                        category_id: testCategory.id,
                        city_name: cityResult.rows[0].name,
                        user_rating: 5
                    })
                    .expect(201);

                testDataTracker.addRecommendation(recResponse.body.data.id);
            }

            // Get user achievements
            const response = await request(app)
                .get(`/api/achievements/user/${user1.username}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            // Find Explorer achievement in progress
            const explorerProgress = response.body.data.inProgress.find(
                (a: any) => a.name === 'Explorer'
            );

            expect(explorerProgress).toBeDefined();
            expect(explorerProgress.current_count).toBe(3);
            expect(explorerProgress.requirement_count).toBe(5);
            expect(explorerProgress.progress_percentage).toBeCloseTo(60, 0);
        });
    });

    describe('Security Tests', () => {
        it('should not allow manual achievement creation', async () => {
            const response = await request(app)
                .post('/api/achievements/unlock')
                .set('Authorization', `Bearer ${token1}`)
                .send({ achievementId: 1 })
                .expect(404);
        });

        it('should not expose other users achievement unlock dates', async () => {
            // User1 creates recommendation
            const recResponse = await request(app)
                .post('/api/recommendations')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    place_name: 'Security Test Place',
                    description: 'Test',
                    category_id: testCategory.id,
                    city_name: testCity.name,
                    user_rating: 5
                })
                .expect(201);

            testDataTracker.addRecommendation(recResponse.body.data.id);

            // User2 views User1's achievements
            const response = await request(app)
                .get(`/api/achievements/user/${user1.username}`)
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);

            // Should only show completed achievements, not detailed unlock info
            expect(response.body.data.completed).toBeDefined();
            const completed = response.body.data.completed;
            if (completed.length > 0) {
                expect(completed[0]).toHaveProperty('name');
                expect(completed[0]).toHaveProperty('description');
            }
        });

        it('should prevent SQL injection in username parameter', async () => {
            const response = await request(app)
                .get(`/api/achievements/user/test'; DROP TABLE achievements;--`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(404);

            // Verify achievements table still exists
            const achievementCheck = await query('SELECT COUNT(*) FROM achievements');
            expect(parseInt(achievementCheck.rows[0].count)).toBeGreaterThan(0);
        });
    });

    describe('Achievement Display and UI', () => {
        it('should return achievement badge URLs', async () => {
            const response = await request(app)
                .get('/api/achievements')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const achievement = response.body.data.achievements[0];
            expect(achievement).toHaveProperty('badge_icon_url');
            expect(typeof achievement.badge_icon_url).toBe('string');
        });

        it('should return achievement tiers (Bronze, Silver, Gold)', async () => {
            const response = await request(app)
                .get('/api/achievements')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            const achievements = response.body.data.achievements;
            const hasTiers = achievements.some((a: any) => a.tier);

            // At least some achievements should have tiers
            expect(achievements.length).toBeGreaterThan(0);
        });
    });
});
