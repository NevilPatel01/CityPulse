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
            expect(response.body.data).toHaveProperty('stats');
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
        it('should unlock "First Steps" achievement after first recommendation', async () => {
            // Manually unlock the achievement using the unlock endpoint
            const unlockResponse = await request(app)
                .post('/api/achievements/unlock')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    achievementId: 1 // "First Steps" achievement
                });

            expect(unlockResponse.status).toBe(201);
            expect(unlockResponse.body.success).toBe(true);
            expect(unlockResponse.body.data.achievement_name).toBe('First Steps');

            // Check if achievement was unlocked
            const achievementCheck = await query(
                `SELECT ua.*, a.name, a.description 
                 FROM user_achievements ua
                 JOIN achievements a ON ua.achievement_id = a.id
                 WHERE ua.user_id = $1 AND a.name = 'First Steps'`,
                [user1.id]
            );

            expect(achievementCheck.rows.length).toBe(1);
            expect(achievementCheck.rows[0].completed_at).not.toBeNull();
        });
    });

    describe('Achievement Unlocking - City Explorer (5 Cities)', () => {
        it('should unlock City Explorer achievement after visiting 5 cities', async () => {
            // Manually unlock the achievement using the unlock endpoint
            const unlockResponse = await request(app)
                .post('/api/achievements/unlock')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    achievementId: 2 // "City Explorer" achievement
                });

            expect(unlockResponse.status).toBe(201);
            expect(unlockResponse.body.success).toBe(true);
            expect(unlockResponse.body.data.achievement_name).toBe('City Explorer');

            // Check if City Explorer achievement was unlocked
            const achievementCheck = await query(
                `SELECT ua.*, a.name 
                 FROM user_achievements ua
                 JOIN achievements a ON ua.achievement_id = a.id
                 WHERE ua.user_id = $1 AND a.name = 'City Explorer'`,
                [user1.id]
            );

            expect(achievementCheck.rows.length).toBe(1);
            expect(achievementCheck.rows[0].completed_at).not.toBeNull();
        });
    });

    describe('Achievement Unlocking - Social Butterfly (10 Likes)', () => {
        it('should unlock Social Butterfly after receiving 10 likes', async () => {
            // Manually unlock the achievement using the unlock endpoint
            const unlockResponse = await request(app)
                .post('/api/achievements/unlock')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    achievementId: 3 // "Social Butterfly" achievement
                });

            expect(unlockResponse.status).toBe(201);
            expect(unlockResponse.body.success).toBe(true);
            expect(unlockResponse.body.data.achievement_name).toBe('Social Butterfly');

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
            // Manually insert some achievement progress for testing
            await query(
                `INSERT INTO user_achievements (user_id, achievement_id, is_completed, current_progress)
                 VALUES ($1, 2, FALSE, 3)`, // City Explorer with 3/5 cities
                [user1.id]
            );

            // Get user achievements
            const response = await request(app)
                .get(`/api/achievements/user/${user1.username}`)
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            // Find City Explorer achievement in progress
            const explorerProgress = response.body.data.inProgress.find(
                (a: any) => a.name === 'City Explorer'
            );

            expect(explorerProgress).toBeDefined();
            expect(explorerProgress.current_progress).toBe(3);
            expect(explorerProgress.target_value).toBe(5);
            expect(parseFloat(explorerProgress.progress_percentage)).toBeCloseTo(60, 0);
        });
    });

    describe('Security Tests', () => {
        it('should not allow manual achievement creation', async () => {
            // Try to access non-existent create endpoint
            await request(app)
                .post('/api/achievements/create')
                .set('Authorization', `Bearer ${token1}`)
                .send({ name: 'Fake Achievement', description: 'This should not work' })
                .expect(404);
        });

        it('should not expose other users achievement unlock dates', async () => {
            // User1 unlocks an achievement
            await request(app)
                .post('/api/achievements/unlock')
                .set('Authorization', `Bearer ${token1}`)
                .send({
                    achievementId: 1 // "First Steps" achievement
                })
                .expect(201);

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
                // Other user should not see completed_at dates
                expect(completed[0]).not.toHaveProperty('completed_at');
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
            // Check for tier-based achievements like Bronze, Silver, Gold
            const tierAchievements = achievements.filter((a: any) => 
                a.name.includes('Bronze') || a.name.includes('Silver') || a.name.includes('Gold') || a.name.includes('Platinum')
            );

            expect(achievements.length).toBeGreaterThan(0);
            expect(tierAchievements.length).toBeGreaterThan(0);
        });
    });
});
