import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;

// Phone number validation regex
const phoneRegex = /^[+]?[1-9]\d{1,14}$/;

// User registration validation schema
export const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(30, 'Username cannot be longer than 30 characters')
        .regex(/^[a-zA-Z0-9]+$/, 'Username must only contain alphanumeric characters'),

    email: z.string()
        .email('Please provide a valid email address')
        .transform(val => val.toLowerCase().trim()),

    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    fullName: z.string()
        .min(2, 'Full name must be at least 2 characters long')
        .max(100, 'Full name cannot be longer than 100 characters'),

    bio: z.string()
        .max(500, 'Bio cannot be longer than 500 characters')
        .optional()
        .or(z.literal('')),

    currentLocation: z.string()
        .max(100, 'Current location cannot be longer than 100 characters')
        .optional()
        .or(z.literal('')),

    hometown: z.string()
        .max(100, 'Hometown cannot be longer than 100 characters')
        .optional()
        .or(z.literal('')),

    phone: z.string()
        .regex(phoneRegex, 'Please provide a valid phone number')
        .optional()
        .or(z.literal(''))
});

// User login validation schema
export const loginSchema = z.object({
    email: z.string()
        .email('Please provide a valid email address')
        .transform(val => val.toLowerCase().trim()),

    password: z.string()
        .min(1, 'Password is required')
});

// Password reset request validation schema
export const resetPasswordRequestSchema = z.object({
    email: z.string()
        .email('Please provide a valid email address')
        .transform(val => val.toLowerCase().trim())
});

// Verify reset code validation schema
export const verifyResetCodeSchema = z.object({
    resetToken: z.string()
        .min(1, 'Reset token is required'),

    securityCode: z.string()
        .length(6, 'Security code must be exactly 6 digits')
        .regex(/^\d{6}$/, 'Security code must contain only digits')
});

// Password reset validation schema
export const resetPasswordSchema = z.object({
    resetToken: z.string()
        .min(1, 'Reset token is required'),

    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
});

// Change password validation schema
export const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Current password is required'),

    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters long')
        .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    confirmPassword: z.string()
        .min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

// TypeScript types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Verify email validation schema
export const verifyEmailSchema = z.object({
    token: z.string()
        .min(1, 'Verification token is required')
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// Validation middleware
export const validate = (schema: z.ZodSchema<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                const errors = result.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            // Attach validated data to request
            req.body = result.data;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Validation error occurred'
            });
        }
    };
};
