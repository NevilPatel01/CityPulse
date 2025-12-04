/**
 * Google OAuth Configuration
 */

declare global {
    interface Window {
        ENV?: Record<string, string | undefined>;
    }
}

export interface GoogleOAuthConfig {
    clientId: string;
    redirectUri: string;
    scope: string;
}

export interface GoogleUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
}

export interface GoogleOAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    authuser: string;
    prompt: string;
}

const runtimeEnv = typeof window !== 'undefined' ? window.ENV : undefined;
const buildEnvMap = {
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
} as const;
type GoogleEnvKey = keyof typeof buildEnvMap;
const getEnvValue = (key: GoogleEnvKey): string | undefined => {
    return runtimeEnv?.[key] || buildEnvMap[key];
};

// Google OAuth configuration - reads from runtime (if available) or build env
export const googleOAuthConfig: GoogleOAuthConfig = {
    clientId: getEnvValue('VITE_GOOGLE_CLIENT_ID') || '',
    redirectUri: getEnvValue('VITE_GOOGLE_REDIRECT_URI') || 'http://localhost:3001/auth/google/callback',
    scope: 'openid email profile'
};

// Note: Client Secret is kept on backend for security
// Frontend only uses Client ID and Redirect URI

/**
 * Validate that all required Google OAuth environment variables are set 
 * Validates in both development and production with detailed logging
 */
export const validateGoogleOAuthConfig = (): void => {
    const missingVars: string[] = [];
    
    
    const clientId = getEnvValue('VITE_GOOGLE_CLIENT_ID');
    const redirectUri = getEnvValue('VITE_GOOGLE_REDIRECT_URI');
    

    if (!clientId) {
        missingVars.push('VITE_GOOGLE_CLIENT_ID');
    }
    
    if (!redirectUri) {
        missingVars.push('VITE_GOOGLE_REDIRECT_URI');
    }
    
    if (missingVars.length > 0) {
        console.error(`❌ Missing Google OAuth environment variables: ${missingVars.join(', ')}`);
        console.error('Please ensure these are set in your environment configuration.');
    }
};

// Google OAuth URLs
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Generate OAuth authorization URL
 */
export const getGoogleAuthUrl = (
    state?: string,
    userEmail?: string,
    prompt?: 'none' | 'consent' | 'select_account'
): string => {
    validateGoogleOAuthConfig();
    
    const clientId = getEnvValue('VITE_GOOGLE_CLIENT_ID');
    const redirectUri = getEnvValue('VITE_GOOGLE_REDIRECT_URI');
    
    if (!clientId || !redirectUri) {
        const debugInfo = {
            windowENV: window.ENV,
            buildEnv: buildEnvMap,
            clientId: clientId || 'MISSING',
            redirectUri: redirectUri || 'MISSING'
        };
        console.error('❌ Google OAuth Config Error:', debugInfo);
        throw new Error(`Google OAuth configuration is missing. Please check your environment configuration.\n\nDebug Info:\n- Client ID: ${clientId ? 'Set' : 'MISSING'}\n- Redirect URI: ${redirectUri || 'MISSING'}\n- window.ENV: ${JSON.stringify(window.ENV)}`);
    }
    
    
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        include_granted_scopes: 'true'
    });

    if (state) params.append('state', state);
    if (userEmail) params.append('login_hint', userEmail);
    if (prompt) params.append('prompt', prompt);

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    return authUrl;
};

/**
 * Generate random state for OAuth security
 */
export const generateRandomState = (): string => {
    return btoa(crypto.getRandomValues(new Uint8Array(32)).toString());
};

/**
 * Exchange authorization code for access token via backend
 * SECURITY: Token exchange happens on backend to keep client secret secure
 * @deprecated This function is no longer used - token exchange now happens on backend
 */
export const exchangeCodeForToken = async (): Promise<GoogleOAuthResponse> => {
    // Note: This function is deprecated and kept for backwards compatibility
    // The backend will handle the token exchange with Google using the client secret
    // Use the backend endpoint directly: POST /api/auth/google with { code, redirectUri }
    throw new Error('Token exchange should be handled by backend. Send code directly to /api/auth/google');
};

/**
 * Get user info from Google
 */
export const getGoogleUserInfo = async (accessToken: string): Promise<GoogleUser> => {
    
    try {
        const response = await fetch(`${GOOGLE_USER_INFO_URL}?access_token=${accessToken}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to get user info:', response.status, errorText);
            throw new Error(`Failed to get user info from Google: ${response.status} ${errorText}`);
        }

        const userData = await response.json();
        return userData;
        
    } catch (error) {
        console.error('❌ Error getting user info:', error);
        throw error;
    }
};
