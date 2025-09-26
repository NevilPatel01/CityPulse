import request from 'supertest';
import { createApp } from '../app';
import { query } from '../lib/database';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Profile End-to-End Tests', () => {
  let app: any;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    app = createApp();
    
    // Create a test user and get auth token
    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(signupResponse.status).toBe(201);
    authToken = signupResponse.body.data.accessToken;
    userId = signupResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
  });

  describe('GET /api/profile/:username', () => {
    it('should get profile for existing user', async () => {
      const response = await request(app)
        .get('/api/profile/testuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('username', 'testuser');
      expect(response.body.data.user).toHaveProperty('fullName', 'Test User');
      expect(response.body.data.user).toHaveProperty('citiesVisited');
      expect(response.body.data.user).toHaveProperty('stats');
      expect(response.body.data.user).toHaveProperty('badges');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/profile/nonexistentuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should include cities visited in response', async () => {
      // Add cities visited to test user
      await query(
        'UPDATE user_profiles SET cities_visited = $1 WHERE user_id = $2',
        [JSON.stringify(['New York', 'London', 'Tokyo']), userId]
      );

      const response = await request(app)
        .get('/api/profile/testuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.citiesVisited).toEqual(['New York', 'London', 'Tokyo']);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        bio: 'Updated bio',
        currentLocation: 'New York',
        hometown: 'Boston',
        citiesVisited: ['Paris', 'Berlin', 'Madrid'],
        instagramUrl: 'https://instagram.com/testuser',
        facebookUrl: 'https://facebook.com/testuser'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should update username and redirect', async () => {
      const updateData = {
        username: 'newtestuser',
        bio: 'Updated bio with new username'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify username was updated
      const profileResponse = await request(app)
        .get('/api/profile/newtestuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.user.username).toBe('newtestuser');
    });

    it('should reject duplicate username', async () => {
      // Create another user first
      const anotherUser = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'Another User',
          username: 'anotheruser',
          email: 'another@example.com',
          password: 'password123'
        });

      // Try to update first user's username to second user's username
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'anotheruser'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already exists. Please choose a different username.');

      // Clean up
      await query('DELETE FROM users WHERE id = $1', [anotherUser.body.data.user.id]);
    });

    it('should validate username format', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'ab' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate social media URLs', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          instagramUrl: 'invalid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/profile/upload-photo', () => {
    it('should upload profile photo successfully', async () => {
      // Create a mock image file
      const mockImage = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/profile/upload-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', mockImage, 'test.jpg')
        .field('type', 'profile');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toContain('http://localhost:5001');
      expect(response.body.data.imageUrl).toContain('/uploads/profiles/');
    });

    it('should upload cover photo successfully', async () => {
      const mockImage = Buffer.from('fake-cover-data');
      
      const response = await request(app)
        .post('/api/profile/upload-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', mockImage, 'cover.jpg')
        .field('type', 'cover');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toContain('http://localhost:5001');
      expect(response.body.data.imageUrl).toContain('/uploads/covers/');
    });

    it('should reject invalid file types', async () => {
      const mockFile = Buffer.from('fake-text-data');
      
      const response = await request(app)
        .post('/api/profile/upload-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', mockFile, 'test.txt')
        .field('type', 'profile');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const mockImage = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/profile/upload-photo')
        .attach('photo', mockImage, 'test.jpg')
        .field('type', 'profile');

      expect(response.status).toBe(401);
    });
  });

  describe('Profile Statistics', () => {
    it('should calculate cities count from cities visited', async () => {
      // Update cities visited
      await query(
        'UPDATE user_profiles SET cities_visited = $1 WHERE user_id = $2',
        [JSON.stringify(['Paris', 'London', 'Tokyo', 'New York', 'Berlin']), userId]
      );

      const response = await request(app)
        .get('/api/profile/newtestuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.stats.cities).toBe(5);
    });

    it('should handle empty cities visited', async () => {
      await query(
        'UPDATE user_profiles SET cities_visited = $1 WHERE user_id = $2',
        [JSON.stringify([]), userId]
      );

      const response = await request(app)
        .get('/api/profile/newtestuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.stats.cities).toBe(0);
    });
  });

  describe('Profile Completion', () => {
    it('should mark profile as incomplete for new user', async () => {
      const newUser = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'Incomplete User',
          username: 'incompleteuser',
          email: 'incomplete@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .get('/api/profile/incompleteuser')
        .set('Authorization', `Bearer ${newUser.body.data.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.profileCompletion.isComplete).toBe(false);
      expect(response.body.data.user.profileCompletion.percentage).toBeLessThan(100);

      // Clean up
      await query('DELETE FROM users WHERE id = $1', [newUser.body.data.user.id]);
    });

    it('should mark profile as complete with all required fields', async () => {
      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Complete bio',
          currentLocation: 'New York',
          hometown: 'Boston',
          citiesVisited: ['Paris', 'London']
        });

      const response = await request(app)
        .get('/api/profile/newtestuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.profileCompletion.isComplete).toBe(true);
      expect(response.body.data.user.profileCompletion.percentage).toBeGreaterThan(80);
    });
  });

  describe('Image URL Generation', () => {
    it('should return full URLs for profile images', async () => {
      // Upload a profile image first
      const mockImage = Buffer.from('fake-image-data');
      await request(app)
        .post('/api/profile/upload-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', mockImage, 'test.jpg')
        .field('type', 'profile');

      const response = await request(app)
        .get('/api/profile/newtestuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.profilePhotoUrl).toMatch(/^http:\/\/localhost:5001\/uploads\/profiles\//);
    });

    it('should return full URLs for cover images', async () => {
      const mockImage = Buffer.from('fake-cover-data');
      await request(app)
        .post('/api/profile/upload-photo')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', mockImage, 'cover.jpg')
        .field('type', 'cover');

      const response = await request(app)
        .get('/api/profile/newtestuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.coverPhotoUrl).toMatch(/^http:\/\/localhost:5001\/uploads\/covers\//);
    });
  });

  describe('Social Links', () => {
    it('should save and retrieve social links', async () => {
      const socialData = {
        instagramUrl: 'https://instagram.com/testuser',
        facebookUrl: 'https://facebook.com/testuser',
        whatsappContact: '+1234567890'
      };

      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(socialData);

      const response = await request(app)
        .get('/api/profile/newtestuser')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.instagramUrl).toBe(socialData.instagramUrl);
      expect(response.body.data.user.facebookUrl).toBe(socialData.facebookUrl);
      expect(response.body.data.user.whatsappContact).toBe(socialData.whatsappContact);
    });
  });
});
