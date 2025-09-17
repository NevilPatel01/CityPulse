import { beforeAll, afterAll } from '@jest/globals';

// TODO: need to add test cases here
beforeAll(async () => {
    console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
});

export const cleanupDatabase = async (): Promise<void> => {
    console.log('🧽 Test cleanup completed');
};