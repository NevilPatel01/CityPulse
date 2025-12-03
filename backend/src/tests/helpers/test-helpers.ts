/**
 * Test Helpers
 * Reusable functions for creating and cleaning up test data
 */

import { query } from '../../lib/database';
import { hashPassword } from '../../utils/auth';
import jwt from 'jsonwebtoken';

// Store created test data for cleanup
export const testDataTracker = {
    userIds: new Set<number>(),
    recommendationIds: new Set<number>(),
    cityIds: new Set<number>(),
    tripIds: new Set<number>(),

    addUser(id: number) {
        this.userIds.add(id);
    },

    addRecommendation(id: number) {
        this.recommendationIds.add(id);
    },

    addCity(id: number) {
        this.cityIds.add(id);
    },

    addTrip(id: number) {
        this.tripIds.add(id);
    },

    clear() {
        this.userIds.clear();
        this.recommendationIds.clear();
        this.cityIds.clear();
        this.tripIds.clear();
    }
};

/**
 * Generate unique test identifier using timestamp
 */
export const generateTestId = (): string => {
    return `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

/**
 * Generate unique alphanumeric test ID for usernames (no underscores/special chars)
 */
export const generateAlphanumericTestId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8); // Remove leading '0.'
    return `test${timestamp}${random}`;
};

/**
 * Create a test user with profile
 */
export const createTestUser = async (overrides: any = {}) => {
    const testId = generateTestId();
    const alphanumericId = generateAlphanumericTestId();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const uniqueId = `test_${timestamp}_${random}`;

    // Ensure password meets requirements: uppercase, lowercase, number, special char, min 8 chars
    const providedPassword = overrides.password || 'TestPassword123!';
    const validPassword = providedPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
        ? providedPassword
        : 'TestPass123!'; // Default to valid password if provided one doesn't meet requirements

    const hashedPassword = await hashPassword(validPassword);

    const userData = {
        username: overrides.username || alphanumericId,
        email: overrides.email || `test_${testId}@example.com`,
        password_hash: hashedPassword,
        full_name: overrides.fullName || 'Test User',
        bio: overrides.bio || null,
        current_location: overrides.currentLocation || null,
        hometown: overrides.hometown || null,
        phone: overrides.phone || null,
        is_google_user: overrides.isGoogleUser || false,
        google_id: overrides.googleId || null,
        role: overrides.role || 'user',
        account_status: overrides.accountStatus || 'active',
        email_verified: overrides.emailVerified !== undefined ? overrides.emailVerified : true
    };

    const userResult = await query(
        `INSERT INTO users (username, email, password_hash, full_name, bio, current_location, hometown, phone, is_google_user, google_id, role, account_status, email_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, username, email, full_name, bio, current_location, hometown, phone, is_google_user, google_id, role, account_status, email_verified, created_at`,
        [
            userData.username,
            userData.email,
            userData.password_hash,
            userData.full_name,
            userData.bio,
            userData.current_location,
            userData.hometown,
            userData.phone,
            userData.is_google_user,
            userData.google_id,
            userData.role,
            userData.account_status,
            userData.email_verified
        ]
    );

    const user = userResult.rows[0];
    testDataTracker.addUser(user.id);

    // Create user profile
    await query(
        `INSERT INTO user_profiles (user_id, profile_visibility, location_sharing, social_links_visible, travel_buddy_requests_enabled)
            VALUES ($1, $2, $3, $4, $5)`,
        [user.id, 'public', true, true, true]
    );

    return {
        ...user,
        rawPassword: validPassword
    };
};

/**
 * Create a Google OAuth test user
 */
export const createGoogleTestUser = async (overrides: any = {}) => {
    const testId = generateAlphanumericTestId();

    return createTestUser({
        username: overrides.username || testId,
        email: overrides.email || `google${testId}@gmail.com`,
        fullName: overrides.name || 'Google Test User',
        isGoogleUser: true,
        googleId: overrides.googleId || `google${testId}`,
        password_hash: null,
        ...overrides
    });
};

/**
 * Generate JWT token for authenticated requests
 */
export const generateTestToken = (userId: number, role: string = 'user', expiresIn: string | number = '1h'): string => {
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret-key-will-change-in-production';
    return jwt.sign(
        { userId, role, email: `user${userId}@test.com`, username: `user${userId}` },
        secret,
        {
            expiresIn,
            issuer: 'citypulse-api',
            audience: 'citypulse-client'
        } as jwt.SignOptions
    );
};

/**
 * Generate refresh token
 */
export const generateTestRefreshToken = (userId: number, role: string = 'user'): string => {
    const secret = process.env.JWT_REFRESH_SECRET || 'dev-jwt-secret-key-will-change-in-production';
    return jwt.sign(
        { userId, role, email: `user${userId}@test.com`, username: `user${userId}` },
        secret,
        {
            expiresIn: '7d',
            issuer: 'citypulse-api',
            audience: 'citypulse-client'
        } as jwt.SignOptions
    );
};

/**
 * Create a test city
 */
export const createTestCity = async (overrides: any = {}) => {
    const testId = generateTestId();

    const cityData = {
        name: overrides.name || `TestCity_${testId}`,
        country: overrides.country || 'Test Country',
        state_province: overrides.stateProvince || null,
        latitude: overrides.latitude || 43.6532,
        longitude: overrides.longitude || -79.3832,
        timezone: overrides.timezone || 'America/Toronto',
        description: overrides.description || 'Test city description'
    };

    const result = await query(
        `INSERT INTO cities (name, country, state_province, latitude, longitude, timezone, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, country, state_province, latitude, longitude, timezone, description, created_at`,
        [
            cityData.name,
            cityData.country,
            cityData.state_province,
            cityData.latitude,
            cityData.longitude,
            cityData.timezone,
            cityData.description
        ]
    );

    const city = result.rows[0];
    testDataTracker.addCity(city.id);

    return city;
};

/**
 * Create recommendation category if not exists
 */
export const ensureRecommendationCategory = async (categoryName: string = 'Food') => {
    const result = await query(
        `INSERT INTO recommendation_categories (name, description)
            VALUES ($1, $2)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id`,
        [categoryName, `Test ${categoryName} category`]
    );

    return result.rows[0].id;
};

/**
 * Create a valid test JPEG image buffer using Sharp
 */
export const createValidTestImage = async (): Promise<Buffer> => {
    try {
        const sharp = await import('sharp');
        // Create a minimal 1x1 pixel JPEG image
        const imageBuffer = await sharp.default({
            create: {
                width: 100,
                height: 100,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        })
        .jpeg({ quality: 80 })
        .toBuffer();
        return imageBuffer;
    } catch (error) {
        // Fallback: create minimal JPEG header if Sharp fails
        console.warn('Failed to create image with Sharp, using fallback');
        const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
        const jpegData = Buffer.concat([jpegHeader, Buffer.alloc(1000)]);
        return jpegData;
    }
};

/**
 * Create a test recommendation
 */
export const createTestRecommendation = async (userId: number, overrides: any = {}) => {
    const testId = generateTestId();
    const categoryId = await ensureRecommendationCategory(overrides.category || 'Food');

    const recData = {
        title: overrides.title || `Test Recommendation ${testId}`,
        description: overrides.description || 'Test recommendation description',
        category_id: categoryId,
        price_range_min: overrides.priceRangeMin || null,
        price_range_max: overrides.priceRangeMax || null,
        difficulty_level: overrides.difficultyLevel || 'easy',
        address: overrides.address || null,
        latitude: overrides.latitude || null,
        longitude: overrides.longitude || null,
        user_rating: overrides.userRating || 5,
        status: overrides.status || 'active'
    };

    const result = await query(
        `INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, user_rating, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, user_id, title, description, category_id, status, created_at`,
        [
            userId,
            recData.title,
            recData.description,
            recData.category_id,
            recData.price_range_min,
            recData.price_range_max,
            recData.difficulty_level,
            recData.address,
            recData.latitude,
            recData.longitude,
            recData.user_rating,
            recData.status
        ]
    );

    const recommendation = result.rows[0];
    testDataTracker.addRecommendation(recommendation.id);

    return recommendation;
};

/**
 * Create a password reset token
 */
export const createPasswordResetToken = async (userId: number, email: string) => {
    const securityCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = generateTestId();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await query(
        `INSERT INTO password_reset_tokens (user_id, email, security_code, reset_token, expires_at)
            VALUES ($1, $2, $3, $4, $5)`,
        [userId, email, securityCode, resetToken, expiresAt]
    );

    return { securityCode, resetToken };
};

/**
 * Delete a user and all related data (cascade)
 */
export const deleteTestUser = async (userId: number) => {
    try {
        // Delete user (cascade will handle related data)
        await query('DELETE FROM users WHERE id = $1', [userId]);
        testDataTracker.userIds.delete(userId);
    } catch (error) {
        console.error(`Error deleting test user ${userId}:`, error);
    }
};

/**
 * Delete multiple users
 */
export const deleteTestUsers = async (userIds: number[]) => {
    if (userIds.length === 0) return;

    try {
        await query(
            `DELETE FROM users WHERE id = ANY($1)`,
            [userIds]
        );
        userIds.forEach(id => testDataTracker.userIds.delete(id));
    } catch (error) {
        console.error('Error deleting test users:', error);
    }
};

/**
 * Delete all tracked test data
 */
export const cleanupAllTestData = async () => {
    try {
        // Delete trip companions first
        if (testDataTracker.tripIds.size > 0) {
            await query(
                `DELETE FROM trip_companions WHERE trip_id = ANY($1)`,
                [Array.from(testDataTracker.tripIds)]
            );
        }

        // Delete trips
        if (testDataTracker.tripIds.size > 0) {
            await query(
                `DELETE FROM trips WHERE id = ANY($1)`,
                [Array.from(testDataTracker.tripIds)]
            );
        }

        // Delete recommendations first (if not cascade)
        if (testDataTracker.recommendationIds.size > 0) {
            await query(
                `DELETE FROM recommendations WHERE id = ANY($1)`,
                [Array.from(testDataTracker.recommendationIds)]
            );
        }

        // Delete users (cascade handles profiles, trips, etc.)
        if (testDataTracker.userIds.size > 0) {
            await query(
                `DELETE FROM users WHERE id = ANY($1)`,
                [Array.from(testDataTracker.userIds)]
            );
        }

        // Delete cities
        if (testDataTracker.cityIds.size > 0) {
            await query(
                `DELETE FROM cities WHERE id = ANY($1)`,
                [Array.from(testDataTracker.cityIds)]
            );
        }

        testDataTracker.clear();
    } catch (error) {
        console.error('Error cleaning up test data:', error);
        throw error;
    }
};

/**
 * Clean up test data by email pattern
 */
export const cleanupTestDataByPattern = async (emailPattern: string = '%test_%') => {
    try {
        // Get user IDs first
        const result = await query(
            `SELECT id FROM users WHERE email LIKE $1`,
            [emailPattern]
        );

        const userIds = result.rows.map(row => row.id);

        if (userIds.length > 0) {
            // Delete users (cascade handles related data)
            await query(
                `DELETE FROM users WHERE id = ANY($1)`,
                [userIds]
            );
        }
    } catch (error) {
        console.error('Error cleaning up test data by pattern:', error);
    }
};

/**
 * Verify database connection
 */
export const verifyDatabaseConnection = async (): Promise<boolean> => {
    try {
        console.log('🔍 Attempting database connection with:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
        await query('SELECT 1');
        console.log('✅ Database query successful');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
};

/**
 * Get test user count
 */
export const getTestUserCount = async (): Promise<number> => {
    const result = await query(
        `SELECT COUNT(*) as count FROM users WHERE email LIKE '%test_%'`
    );
    return parseInt(result.rows[0].count);
};
