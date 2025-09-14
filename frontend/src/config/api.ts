/**
 * API Configuration
 * It Handles dynamic API URL configuration for different environments
 */

interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
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
    timeout: 10000,  // 10 seconds
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
        resetPassword: buildApiUrl('api/auth/reset-password'),
        profile: buildApiUrl('api/auth/profile'),
        refresh: buildApiUrl('api/auth/refresh'),
        googleOAuth: buildApiUrl('api/auth/google'),
    },

    // Health check
    health: buildApiUrl('api/health'),

};

/**
 * Enhanced fetch wrapper with retry logic and error handling
 */
export const apiRequest = async <T = unknown>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    const { retries, timeout } = apiConfig;

    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
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
                    error: `HTTP ${response.status}: ${response.statusText}`
                }));

                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            // Try to parse JSON, fallback to text if it fails invalid JSON
            try {
                return await response.json();
            } catch {
                return await response.text() as T;
            }
        } catch (error) {
            lastError = error as Error;

            // Don't retry on certain errors
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }

                // Don't retry on client errors 
                if (error.message.includes('40')) {
                    throw error;
                }
            }

            // Only retry on network errors or 5xx server errors
            if (attempt < retries) {
                // Exponential backoff: wait 1s, 2s, 4s between retries
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                continue;
            }
        }
    }

    throw lastError!;
};
