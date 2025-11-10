import { describe, it, expect, beforeAll } from '@jest/globals';

import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyToken
} from '../../utils/auth';

describe('Auth Utilities', () => {
    beforeAll(() => {
        // Set environment variables for all tests
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
        process.env.JWT_EXPIRES_IN = '15m';
        process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
    });

    describe('Password Hashing', () => {
        const password = 'TestPassword123!';

        it('should hash password correctly', async () => {
            const hashedPassword = await hashPassword(password);

            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(typeof hashedPassword).toBe('string');
            expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hash should be longer
        });

        it('should verify correct password', async () => {
            const hashedPassword = await hashPassword(password);
            const isValid = await comparePassword(password, hashedPassword);

            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const hashedPassword = await hashPassword(password);
            const isValid = await comparePassword('WrongPassword123!', hashedPassword);

            expect(isValid).toBe(false);
        });

        it('should generate different hashes for same password', async () => {
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);

            // Both should still verify correctly
            expect(await comparePassword(password, hash1)).toBe(true);
            expect(await comparePassword(password, hash2)).toBe(true);
        });
    });

    describe('JWT Token Generation', () => {
        const mockPayload = {
            userId: 1,
            email: 'test@example.com',
            username: 'testuser',
            role: 'user' as const
        };

        beforeAll(() => {
            // Set environment variables for testing
            process.env.JWT_SECRET = 'test-secret-key';
            process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
        });

        it('should generate access token', () => {
            const token = generateAccessToken(mockPayload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should generate refresh token', () => {
            const token = generateRefreshToken(mockPayload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should generate tokens with correct format', () => {
            const token1 = generateAccessToken(mockPayload);
            const token2 = generateRefreshToken(mockPayload);

            // Both should be valid JWT format (3 parts separated by dots)
            expect(token1.split('.')).toHaveLength(3);
            expect(token2.split('.')).toHaveLength(3);
            
            // Decode tokens to verify they're valid
            const decoded1 = verifyToken(token1);
            const decoded2 = verifyToken(token2);
            
            expect(decoded1).not.toBeNull();
            expect(decoded2).not.toBeNull();
            
            // Both tokens should contain the payload
            if (decoded1 && decoded2) {
                expect(decoded1.userId).toBe(mockPayload.userId);
                expect(decoded2.userId).toBe(mockPayload.userId);
                
                // Both should have expiry times (even if they're configured the same in test env)
                expect('exp' in decoded1).toBe(true);
                expect('exp' in decoded2).toBe(true);
            }
        });
    });

    describe('JWT Token Verification', () => {
        const mockPayload = {
            userId: 1,
            email: 'test@example.com',
            username: 'testuser',
            role: 'user' as const
        };

        beforeAll(() => {
            // Set environment variables for testing
            process.env.JWT_SECRET = 'test-secret-key';
            process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
        });

        it('should verify valid access token', () => {
            const token = generateAccessToken(mockPayload);
            const decoded = verifyToken(token);

            expect(decoded).toBeDefined();
            expect(decoded).not.toBeNull();
            if (decoded) {
                expect(decoded.userId).toBe(mockPayload.userId);
                expect(decoded.email).toBe(mockPayload.email);
                expect(decoded.username).toBe(mockPayload.username);
                expect(decoded.role).toBe(mockPayload.role);
            }
        });

        it('should return null for invalid token', () => {
            const decoded = verifyToken('invalid-token');
            expect(decoded).toBeNull();
        });

        it('should return null for empty token', () => {
            const decoded = verifyToken('');
            expect(decoded).toBeNull();
        });

        it('should return null for malformed token', () => {
            const decoded = verifyToken('not.a.valid.jwt.token');
            expect(decoded).toBeNull();
        });
    });
});
