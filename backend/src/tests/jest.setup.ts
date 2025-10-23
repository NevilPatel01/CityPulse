/**
 * Jest Global Setup
 * Runs before all tests
 */

import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

import { verifyDatabaseConnection, cleanupTestDataByPattern } from './helpers/test-helpers';

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
    console.log('\n🧪 Starting Test Suite...\n');
    
    // Verify database connection
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
        throw new Error('❌ Database connection failed. Tests cannot run.');
    }
    console.log('✅ Database connection verified\n');

    // Clean up any leftover test data from previous runs
    await cleanupTestDataByPattern('%test_%');
    console.log('✅ Cleaned up previous test data\n');
});

// Global teardown after all tests
afterAll(async () => {
    console.log('\n🧹 Cleaning up after tests...\n');
    
    // Final cleanup of all test data
    await cleanupTestDataByPattern('%test_%');
    console.log('✅ Test cleanup complete\n');
    console.log('🎉 Test Suite Finished!\n');
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
