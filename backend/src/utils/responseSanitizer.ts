/**
 * Response sanitization utilities for API security
 * Removes sensitive data from responses before sending to clients
 */

/**
 * Fields that should NEVER be exposed in API responses
 */
const SENSITIVE_FIELDS = [
    'password_hash',
    'passwordHash',
    'password',
    'reset_token',
    'resetToken',
    'verification_token',
    'verificationToken',
    'refresh_token',
    'refreshToken',
    'security_code',
    'securityCode',
    'internal_note',
    'internalNote',
];

/**
 * Fields that should only be exposed to the user themselves
 */
const PRIVATE_FIELDS = [
    'email',
    'phone',
    'account_status',
    'accountStatus',
    'email_verified',
    'emailVerified',
    'role',
    'profile_visibility',
    'profileVisibility',
    'location_sharing',
    'locationSharing',
    'social_links_visible',
    'socialLinksVisible',
    'travel_buddy_requests_enabled',
    'travelBuddyRequestsEnabled',
    'deactivated_at',
    'deactivatedAt',
    'last_login',
    'lastLogin',
];

/**
 * Remove sensitive fields from an object
 */
export function removeSensitiveFields<T extends Record<string, any>>(obj: T): Omit<T, typeof SENSITIVE_FIELDS[number]> {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const sanitized = { ...obj };

    for (const field of SENSITIVE_FIELDS) {
        delete sanitized[field];
    }

    return sanitized;
}

/**
 * Sanitize user object for public responses (no private fields)
 */
export function sanitizeUserForPublic(user: any): any {
    if (!user || typeof user !== 'object') {
        return user;
    }

    const sanitized = { ...user };

    // Remove all sensitive fields
    for (const field of SENSITIVE_FIELDS) {
        delete sanitized[field];
    }

    // Remove private fields for public responses
    for (const field of PRIVATE_FIELDS) {
        delete sanitized[field];
    }

    // Ensure password_hash is never present
    delete sanitized.password_hash;
    delete sanitized.passwordHash;

    return sanitized;
}

/**
 * Sanitize user object for own user responses (includes private but not sensitive)
 */
export function sanitizeUserForSelf(user: any): any {
    if (!user || typeof user !== 'object') {
        return user;
    }

    const sanitized = { ...user };

    // Remove all sensitive fields
    for (const field of SENSITIVE_FIELDS) {
        delete sanitized[field];
    }

    // Ensure password_hash is never present
    delete sanitized.password_hash;
    delete sanitized.passwordHash;

    // Private fields are kept for own user responses

    return sanitized;
}

/**
 * Sanitize user object based on whether viewer is the owner
 */
export function sanitizeUser(user: any, isOwnUser: boolean): any {
    return isOwnUser ? sanitizeUserForSelf(user) : sanitizeUserForPublic(user);
}

/**
 * Sanitize an array of users
 */
export function sanitizeUsers(users: any[], isOwnUsers: boolean = false): any[] {
    if (!Array.isArray(users)) {
        return [];
    }

    return users.map(user => sanitizeUser(user, isOwnUsers));
}

/**
 * Recursively remove sensitive fields from nested objects
 */
export function deepSanitize<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item)) as T;
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive fields
        if (SENSITIVE_FIELDS.includes(key)) {
            continue;
        }

        // Recursively sanitize nested objects and arrays
        if (value && typeof value === 'object') {
            sanitized[key] = deepSanitize(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}

/**
 * Check if a database query result might expose sensitive data
 */
export function validateQueryResult(rows: any[]): void {
    if (!Array.isArray(rows)) {
        return;
    }

    for (const row of rows) {
        if (row && typeof row === 'object') {
            for (const field of SENSITIVE_FIELDS) {
                if (field in row) {
                    console.warn(`[SECURITY] Sensitive field "${field}" detected in query result. This should be removed before sending response.`);
                }
            }
        }
    }
}

