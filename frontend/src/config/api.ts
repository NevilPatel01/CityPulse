/**
 * API Configuration
 * It Handles dynamic API URL configuration for different environments
 */

interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
}

interface ValidationError {
    field: string;
    message: string;
}

/**
 * It get the API base URL based on environment variables and current context
 */
const getApiBaseUrl = (): string => {
    // Priority 1: Development environment
    if (import.meta.env.DEV) {
        // For development with Docker
        return 'http://localhost:5001';
    }

    // Fallback for other environments
    return window.location.origin;
};

/**
 * API Configuration object
 */
export const apiConfig: ApiConfig = {
    baseUrl: getApiBaseUrl(),
    timeout: 30000,  // 30 seconds (increased for email operations)
    retries: 3
};

/**
 * This is a Utility function to build API endpoints
 */
export const buildApiUrl = (endpoint: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Ensure baseUrl doesn't end with slash to avoid double slashes
    const cleanBaseUrl = apiConfig.baseUrl.endsWith('/')
        ? apiConfig.baseUrl.slice(0, -1)
        : apiConfig.baseUrl;

    return `${cleanBaseUrl}/${cleanEndpoint}`;
};

/**
 * Common API endpoints
 */
export const apiEndpoints = {
    // Authentication endpoints
    auth: {
        login: buildApiUrl('api/auth/login'),
        register: buildApiUrl('api/auth/register'),
        logout: buildApiUrl('api/auth/logout'),
        resetPassword: buildApiUrl('api/auth/reset-password/confirm'),
        requestPasswordReset: buildApiUrl('api/auth/reset-password/request'),
        verifyResetCode: buildApiUrl('api/auth/reset-password/verify'),
        profile: buildApiUrl('api/auth/profile'),
        refresh: buildApiUrl('api/auth/refresh'),
        googleOAuth: buildApiUrl('api/auth/google'),
    },

    // Health check
    health: buildApiUrl('api/health'),

    // Profile endpoints
    profile: {
        get: (username: string) => buildApiUrl(`api/profile/${username}`),
        update: buildApiUrl('api/profile'),
        uploadPhoto: buildApiUrl('api/profile/photo'),
        deletePhoto: (type: string) => buildApiUrl(`api/profile/photo/${type}`),
        getStats: buildApiUrl('api/profile/stats'),
        getBadges: buildApiUrl('api/profile/badges'),
    },

};

/**
 * Enhanced fetch wrapper with retry logic and error handling
 */
export const apiRequest = async <T = unknown>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    const { retries, timeout } = apiConfig;

    // Get auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    
    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
            ...options.headers,
        },
        credentials: 'include', // Include cookies for auth
        ...options,
    };

    // Add timeout to the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    defaultOptions.signal = controller.signal;

    let lastError: Error;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, defaultOptions);
            clearTimeout(timeoutId);

            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: `HTTP ${response.status}: ${response.statusText}`
                }));
                
                // Handle validation errors with detailed messages
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const errorMessages = errorData.errors.map((err: ValidationError) => 
                        `${err.field}: ${err.message}`
                    ).join(', ');
                    throw new Error(`${errorData.message || 'Validation failed'}: ${errorMessages}`);
                }
                
                throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
            }

            // Try to parse JSON, fallback to text if it fails invalid JSON
            try {
                const data = await response.json();
                return data;
            } catch {
                const text = await response.text() as T;
                return text;
            }
        } catch (error) {
            lastError = error as Error;

            // Don't retry on certain errors
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout - Email operations may take longer. Please wait for the email and try again.');
                }

                // Don't retry on client errors 
                if (error.message.includes('40')) {
                    throw error;
                }
            }

            // Only retry on network errors or 5xx server errors
            if (attempt < retries) {
                const waitTime = Math.pow(2, attempt) * 1000;
                // Exponential backoff: wait 1s, 2s, 4s between retries
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
        }
    }

    throw lastError!;
};

/**
 * Specialized API request for email operations with extended timeout
 */
export const apiRequestWithExtendedTimeout = async <T = unknown>(
    url: string,
    options: RequestInit = {},
    customTimeout: number = 60000 // 60 seconds for email operations
): Promise<T> => {
    const { retries } = apiConfig;

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include',
        ...options,
    };

    // Use custom timeout for email operations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), customTimeout);
    defaultOptions.signal = controller.signal;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, defaultOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: `HTTP ${response.status}: ${response.statusText}`
                }));
                
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    const errorMessages = errorData.errors.map((err: ValidationError) => 
                        `${err.field}: ${err.message}`
                    ).join(', ');
                    throw new Error(`${errorData.message || 'Validation failed'}: ${errorMessages}`);
                }
                
                throw new Error(errorData.message || errorData.error || `Request failed with status ${response.status}`);
            }

            try {
                const data = await response.json();
                return data;
            } catch {
                const text = await response.text() as T;
                return text;
            }
        } catch (error) {
            lastError = error as Error;

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Email sending is taking longer than expected. Please check your email and try again.');
                }

                if (error.message.includes('40')) {
                    throw error;
                }
            }

            if (attempt < retries) {
                const waitTime = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
        }
    }

    throw lastError!;
};
