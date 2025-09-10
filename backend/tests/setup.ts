import { PrismaClient } from '@prisma/client';

// Global test setup
const prisma = new PrismaClient();

beforeAll(async () => {
    // Setup test database
    console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
    // Clean up test database
    console.log('🧹 Cleaning up test environment...');
    await prisma.$disconnect();
});

// Helper function to clean database between tests
export const cleanupDatabase = async () => {
    await prisma.user.deleteMany({
        where: {
            email: {
                contains: 'test'
            }
        }
    });
};

// Export prisma for use in tests
export { prisma };
