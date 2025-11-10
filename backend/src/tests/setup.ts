import { query } from '../lib/database';
import { hashPassword } from '../utils/auth';
import jwt from 'jsonwebtoken';

/**
 * Setup test database and clean up test data
 */
export const setupTestDatabase = async () => {
  // Clean up test data
  try {
    await query('DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
    await query('DELETE FROM users WHERE email LIKE \'%test%\'');
  } catch (error) {
    console.error('Error setting up test database:', error);
  }
};

/**
 * Clean up test database (alias for setupTestDatabase)
 */
export const cleanupTestDatabase = async () => {
  await setupTestDatabase();
};

/**
 * Clean up database (another alias for backward compatibility)
 */
export const cleanupDatabase = async () => {
  await setupTestDatabase();
};

/**
 * Create a test user with proper password hashing
 */
export const createTestUser = async (overrides: any = {}) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const uniqueId = `test${timestamp}${random}`;
  
  const password = overrides.password || 'TestPassword123!';
  const passwordHash = await hashPassword(password);
  
  const testUser = {
    fullName: overrides.fullName || 'Test User',
    username: overrides.username || uniqueId,
    email: overrides.email || `${uniqueId}@example.com`,
    password_hash: passwordHash,
    account_status: overrides.accountStatus || 'active',
    is_google_user: overrides.isGoogleUser || false,
    google_id: overrides.googleId || null,
    email_verified: overrides.emailVerified || false
  };
  
  // Create user
  const result = await query(
    `INSERT INTO users (full_name, username, email, password_hash, account_status, is_google_user, google_id, email_verified) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING id, username, email, full_name, account_status, is_google_user, google_id, email_verified, created_at`,
    [
      testUser.fullName, 
      testUser.username, 
      testUser.email, 
      testUser.password_hash, 
      testUser.account_status,
      testUser.is_google_user,
      testUser.google_id,
      testUser.email_verified
    ]
  );
  
  const userId = result.rows[0].id;
  
  // Create user profile
  await query(
    'INSERT INTO user_profiles (user_id, profile_visibility, location_sharing, social_links_visible, travel_buddy_requests_enabled) VALUES ($1, $2, $3, $4, $5)',
    [userId, 'public', true, true, true]
  );
  
  return { 
    ...result.rows[0], 
    rawPassword: password 
  };
};

/**
 * Generate JWT token for authenticated requests
 */
export const generateTestToken = (userId: number, expiresIn: string | number = '1h'): string => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(
    { 
      userId, 
      role: 'user', 
      email: `user${userId}@test.com`, 
      username: `user${userId}` 
    }, 
    secret, 
    { 
      expiresIn,
      issuer: 'citypulse-api',
      audience: 'citypulse-client'
    } as jwt.SignOptions
  );
};

/**
 * Generate refresh token
 */
export const generateTestRefreshToken = (userId: number): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
  return jwt.sign(
    { 
      userId, 
      role: 'user', 
      email: `user${userId}@test.com`, 
      username: `user${userId}` 
    }, 
    secret, 
    { 
      expiresIn: '7d',
      issuer: 'citypulse-api',
      audience: 'citypulse-client'
    } as jwt.SignOptions
  );
};

/**
 * Create a test image buffer
 */
export const createTestImage = (filename: string, size: number = 1024) => {
  return Buffer.alloc(size, 'fake-image-data');
};