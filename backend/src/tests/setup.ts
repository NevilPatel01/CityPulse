import { query } from '../lib/database';

export const setupTestDatabase = async () => {
  // Create test database if it doesn't exist
  await query('CREATE DATABASE IF NOT EXISTS citypulse_test');
  
  // Clean up test data
  await query('DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
  await query('DELETE FROM users WHERE email LIKE \'%test%\'');
};

export const cleanupTestDatabase = async () => {
  // Clean up test data
  await query('DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%test%\')');
  await query('DELETE FROM users WHERE email LIKE \'%test%\'');
};

export const createTestUser = async () => {
  const testUser = {
    fullName: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };
  
  // Create user
  const result = await query(
    'INSERT INTO users (full_name, username, email, password_hash, account_status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [testUser.fullName, testUser.username, testUser.email, 'hashed_password', 'active']
  );
  
  const userId = result.rows[0].id;
  
  // Create user profile
  await query(
    'INSERT INTO user_profiles (user_id, cities_visited) VALUES ($1, $2)',
    [userId, JSON.stringify(['Paris', 'London', 'Tokyo'])]
  );
  
  return { ...testUser, id: userId };
};

export const createTestImage = (filename: string, size: number = 1024) => {
  return Buffer.alloc(size, 'fake-image-data');
};