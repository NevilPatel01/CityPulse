module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
    ],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: './tsconfig.test.json'
        }],
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/tests/**',
        '!src/index.ts',
        '!src/scripts/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    clearMocks: true,
    restoreMocks: true,
    resetMocks: false,
    testTimeout: 30000, // Increased to 30 seconds for integration tests
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$))'
    ],
    globals: {
        'ts-jest': {
            useESM: false
        }
    }
};