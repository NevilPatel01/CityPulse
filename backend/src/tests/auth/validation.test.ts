import { describe, it, expect } from '@jest/globals';


import {
    registerSchema,
    loginSchema,
    changePasswordSchema
} from '../../validators/auth'; 

    describe('Auth Validation Schemas', () => {
    describe('registerSchema', () => {
        const validData = {
            username: 'validuser123',
            email: 'valid@example.com',
            password: 'ValidPassword123!',
            fullName: 'Valid User',
            bio: 'This is a valid bio',
            currentLocation: 'Toronto, Canada',
            hometown: 'Montreal, Canada',
            phone: '+1234567890'
        };

        it('should pass validation with valid data', () => {
            const result = registerSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail validation with short username', () => {
            const result = registerSchema.safeParse({
                ...validData,
                username: 'ab'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('at least 3 characters');
            }
        });

        it('should fail validation with invalid email', () => {
            const result = registerSchema.safeParse({
                ...validData,
                email: 'invalid-email'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('valid email');
            }
        });

        it('should fail validation with weak password', () => {
            const result = registerSchema.safeParse({
                ...validData,
                password: 'weak'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.length).toBeGreaterThan(0);
            }
        });

        it('should fail validation with short full name', () => {
            const result = registerSchema.safeParse({
                ...validData,
                fullName: 'A'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('at least 2 characters');
            }
        });

        it('should pass validation with optional fields omitted', () => {
            const minimalData = {
                username: validData.username,
                email: validData.email,
                password: validData.password,
                fullName: validData.fullName
            };
            const result = registerSchema.safeParse(minimalData);
            expect(result.success).toBe(true);
        });
    });

    describe('loginSchema', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'TestPassword123!'
        };

        it('should pass validation with valid credentials', () => {
            const result = loginSchema.safeParse(validLoginData);
            expect(result.success).toBe(true);
        });

        it('should fail validation with invalid email', () => {
            const result = loginSchema.safeParse({
                ...validLoginData,
                email: 'invalid-email'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('valid email');
            }
        });

        it('should fail validation with empty password', () => {
            const result = loginSchema.safeParse({
                ...validLoginData,
                password: ''
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('required');
            }
        });

        it('should fail validation with missing fields', () => {
            const result = loginSchema.safeParse({});
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.length).toBe(2); // email and password required
            }
        });
    });

    describe('changePasswordSchema', () => {
        const validChangePasswordData = {
            currentPassword: 'CurrentPassword123!',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
        };

        it('should pass validation with valid passwords', () => {
            const result = changePasswordSchema.safeParse(validChangePasswordData);
            expect(result.success).toBe(true);
        });

        it('should fail validation when passwords do not match', () => {
            const result = changePasswordSchema.safeParse({
                ...validChangePasswordData,
                confirmPassword: 'DifferentPassword123!'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('match');
            }
        });

        it('should fail validation with weak new password', () => {
            const result = changePasswordSchema.safeParse({
                ...validChangePasswordData,
                newPassword: 'weak',
                confirmPassword: 'weak'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.length).toBeGreaterThan(0);
            }
        });

        it('should fail validation with missing current password', () => {
            const result = changePasswordSchema.safeParse({
                newPassword: validChangePasswordData.newPassword,
                confirmPassword: validChangePasswordData.confirmPassword
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some(issue => issue.path.includes('currentPassword'))).toBe(true);
            }
        });
    });
});
