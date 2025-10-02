import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { generateAccessToken } from '../../utils/auth';

// Mock Express request and response objects
const mockRequest = (headers: any = {}, user: any = null) => {
    const req = {
        headers,
        user
    } as Request;
    return req;
};

const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res) as any;
    res.json = jest.fn().mockReturnValue(res) as any;
    return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-key';
    });

    describe('authenticateToken', () => {
        // it('should authenticate valid token from Authorization header', async () => {
        //     const mockPayload = {
        //         userId: 1,
        //         email: 'test@example.com',
        //         username: 'testuser',
        //         role: 'user' as const
        //     };

        //     const token = generateAccessToken(mockPayload);
        //     const req = mockRequest({
        //         authorization: `Bearer ${token}`
        //     });
        //     const res = mockResponse();

        //     await authenticateToken(req, res, mockNext);

        //     expect(req.user).toBeDefined();
        //     if (req.user) {
        //         expect(req.user.userId).toBe(mockPayload.userId);
        //     }
        //     expect(mockNext).toHaveBeenCalled();
        //     expect(res.status).not.toHaveBeenCalled();
        // });

        it('should return 401 for missing token', async () => {
            const req = mockRequest();
            const res = mockResponse();

            await authenticateToken(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access token required'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 for invalid token', async () => {
            const req = mockRequest({
                authorization: 'Bearer invalid-token'
            });
            const res = mockResponse();

            await authenticateToken(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid or expired token'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 for malformed authorization header', async () => {
            const req = mockRequest({
                authorization: 'InvalidFormat token'
            });
            const res = mockResponse();

            await authenticateToken(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access token required'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('requireRole', () => {
        it('should allow user with correct role', async () => {
            const req = mockRequest({}, {
                userId: 1,
                role: 'admin'
            });
            const res = mockResponse();
            const roleMiddleware = requireRole('admin');

            await roleMiddleware(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should deny user with incorrect role', async () => {
            const req = mockRequest({}, {
                userId: 1,
                role: 'user'
            });
            const res = mockResponse();
            const roleMiddleware = requireRole('admin');

            await roleMiddleware(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Insufficient permissions'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should deny request without user', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const roleMiddleware = requireRole('admin');

            await roleMiddleware(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication required'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should allow multiple roles', async () => {
            const req = mockRequest({}, {
                userId: 1,
                role: 'moderator'
            });
            const res = mockResponse();
            const roleMiddleware = requireRole('admin', 'moderator');

            await roleMiddleware(req, res, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
