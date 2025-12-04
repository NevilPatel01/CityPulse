/**
 * Jest Global Setup
 * Runs before all tests
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load test environment variables
// Try to load .env.test, fallback to .env if not found
const testEnvPath = path.resolve(__dirname, '../../.env.test');
const envPath = fs.existsSync(testEnvPath) ? testEnvPath : path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Override with test-specific environment variables
process.env.NODE_ENV = 'test';
if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) {
    // Derive test database URL from DATABASE_URL by replacing database name
    process.env.TEST_DATABASE_URL = process.env.DATABASE_URL.replace(/\/([^\/]+)$/, '/citypulse_test');
}
if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

import { verifyDatabaseConnection, cleanupTestDataByPattern } from './helpers/test-helpers';
import { closePool } from '../lib/database';

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
    
    // Verify database connection
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
        throw new Error('❌ Database connection failed. Tests cannot run.');
    }

    // Clean up any leftover test data from previous runs
    await cleanupTestDataByPattern('%test_%');
});

// Global teardown after all tests
afterAll(async () => {
    
    // Final cleanup of all test data
    await cleanupTestDataByPattern('%test_%');
    
    // Close database pool to prevent open handles
    try {
        await closePool();
    } catch (error) {
        console.error('⚠️ Error closing database pool:', error);
    }
    
});

// Suppress console logs during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
//     // Keep error for debugging
//     error: console.error,
// };
