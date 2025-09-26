import request from 'supertest';
import { createApp } from '../../app';
import { query } from '../../lib/database';
import { generateTestToken } from '../setup';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Profile API Tests', () => {
  let testUser: any;
  let authToken: string;
  let testProfile: any;

  beforeAll(async () => {
    // Create test user
    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, full_name, bio, current_location, hometown, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, email, full_name, bio, current_location, hometown, phone, created_at`,
      [
        'testuser',
        'test@example.com',
        '$2b$10$testhash',
        'Test User',
        'Test bio for profile',
        'Test City',
        'Test Hometown',
        '+1234567890'
      ]
    );
    testUser = userResult.rows[0];

    // Create test profile
    const profileResult = await query(
      `INSERT INTO user_profiles (user_id, profile_photo_url, cover_photo_url, instagram_url, facebook_url, whatsapp_contact, profile_visibility, location_sharing, social_links_visible, travel_buddy_requests_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        testUser.id,
        'https://example.com/profile.jpg',
        'https://example.com/cover.jpg',
        'https://instagram.com/testuser',
        'https://facebook.com/testuser',
        '+1234567890',
        'public',
        true,
        true,
        true
      ]
    );
    testProfile = profileResult.rows[0];

    // Generate auth token
    authToken = generateTestToken(testUser.id);
  });

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM user_profiles WHERE user_id = $1', [testUser.id]);
    await query('DELETE FROM users WHERE id = $1', [testUser.id]);
  });

  describe('GET /api/profile/:username', () => {
    it('should get user profile successfully', async () => {
      const response = await request(createApp)
        .get(`/api/profile/${testUser.username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        username: testUser.username,
        fullName: testUser.full_name,
        bio: testUser.bio,
        currentLocation: testUser.current_location,
        hometown: testUser.hometown,
        profilePhotoUrl: testProfile.profile_photo_url,
        coverPhotoUrl: testProfile.cover_photo_url,
        isOwnProfile: false
      });
      expect(response.body.data.user.stats).toBeDefined();
      expect(response.body.data.user.badges).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(createApp)
        .get('/api/profile/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 403 for private profile when not owner', async () => {
      // Update profile to private
      await query(
        'UPDATE user_profiles SET profile_visibility = $1 WHERE user_id = $2',
        ['private', testUser.id]
      );

      const response = await request(createApp)
        .get(`/api/profile/${testUser.username}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('This profile is private');

      // Reset to public
      await query(
        'UPDATE user_profiles SET profile_visibility = $1 WHERE user_id = $2',
        ['public', testUser.id]
      );
    });

    it('should show sensitive data for profile owner', async () => {
      const response = await request(createApp)
        .get(`/api/profile/${testUser.username}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.user.isOwnProfile).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.phone).toBe(testUser.phone);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        bio: 'Updated bio',
        currentLocation: 'Updated City',
        hometown: 'Updated Hometown',
        phone: '+9876543210',
        instagramUrl: 'https://instagram.com/updated',
        facebookUrl: 'https://facebook.com/updated',
        whatsappContact: '+9876543210',
        profileVisibility: 'private',
        locationSharing: false,
        socialLinksVisible: false,
        travelBuddyRequestsEnabled: false
      };

      const response = await request(createApp)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');

      // Verify update in database
      const userResult = await query(
        'SELECT bio, current_location, hometown, phone FROM users WHERE id = $1',
        [testUser.id]
      );
      const profileResult = await query(
        'SELECT instagram_url, facebook_url, whatsapp_contact, profile_visibility, location_sharing, social_links_visible, travel_buddy_requests_enabled FROM user_profiles WHERE user_id = $1',
        [testUser.id]
      );

      expect(userResult.rows[0].bio).toBe(updateData.bio);
      expect(userResult.rows[0].current_location).toBe(updateData.currentLocation);
      expect(userResult.rows[0].hometown).toBe(updateData.hometown);
      expect(userResult.rows[0].phone).toBe(updateData.phone);
      expect(profileResult.rows[0].instagram_url).toBe(updateData.instagramUrl);
      expect(profileResult.rows[0].facebook_url).toBe(updateData.facebookUrl);
      expect(profileResult.rows[0].whatsapp_contact).toBe(updateData.whatsappContact);
      expect(profileResult.rows[0].profile_visibility).toBe(updateData.profileVisibility);
      expect(profileResult.rows[0].location_sharing).toBe(updateData.locationSharing);
      expect(profileResult.rows[0].social_links_visible).toBe(updateData.socialLinksVisible);
      expect(profileResult.rows[0].travel_buddy_requests_enabled).toBe(updateData.travelBuddyRequestsEnabled);
    });

    it('should require authentication', async () => {
      const response = await request(createApp)
        .put('/api/profile')
        .send({ bio: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should validate social media URLs', async () => {
      const invalidData = {
        instagramUrl: 'https://invalid.com/profile',
        facebookUrl: 'https://invalid.com/profile'
      };

      const response = await request(createApp)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid social media URLs');
      expect(response.body.errors).toContain('Instagram URL must be a valid Instagram profile URL');
      expect(response.body.errors).toContain('Facebook URL must be a valid Facebook profile URL');
    });

    it('should validate bio length', async () => {
      const longBio = 'a'.repeat(501);
      const response = await request(createApp)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: longBio })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/profile/stats', () => {
    it('should get user statistics', async () => {
      const response = await request(createApp)
        .get('/api/profile/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cities');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('travelBuddies');
      expect(response.body.data).toHaveProperty('points');
      expect(typeof response.body.data.cities).toBe('number');
      expect(typeof response.body.data.recommendations).toBe('number');
      expect(typeof response.body.data.travelBuddies).toBe('number');
      expect(typeof response.body.data.points).toBe('number');
    });

    it('should require authentication', async () => {
      const response = await request(createApp)
        .get('/api/profile/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('GET /api/profile/badges', () => {
    it('should get user badges', async () => {
      const response = await request(createApp)
        .get('/api/profile/badges')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('badges');
      expect(Array.isArray(response.body.data.badges)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(createApp)
        .get('/api/profile/badges')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('POST /api/profile/photo', () => {
    it('should require authentication', async () => {
      const response = await request(createApp)
        .post('/api/profile/photo')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should validate photo type', async () => {
      const response = await request(createApp)
        .post('/api/profile/photo')
        .set('Authorization', `Bearer ${authToken}`)
        .field('type', 'invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should require photo file', async () => {
      const response = await request(createApp)
        .post('/api/profile/photo')
        .set('Authorization', `Bearer ${authToken}`)
        .field('type', 'profile')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No file uploaded');
    });
  });

  describe('DELETE /api/profile/photo/:type', () => {
    it('should delete profile photo successfully', async () => {
      const response = await request(createApp)
        .delete('/api/profile/photo/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile photo deleted successfully');
    });

    it('should delete cover photo successfully', async () => {
      const response = await request(createApp)
        .delete('/api/profile/photo/cover')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cover photo deleted successfully');
    });

    it('should validate photo type', async () => {
      const response = await request(createApp)
        .delete('/api/profile/photo/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid photo type. Must be profile or cover');
    });

    it('should require authentication', async () => {
      const response = await request(createApp)
        .delete('/api/profile/photo/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });
  });
});
