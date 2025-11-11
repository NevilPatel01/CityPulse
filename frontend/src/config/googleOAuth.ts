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
    VITE_GOOGLE_CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
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

// Environment variables for Google OAuth
const getGoogleClientSecret = (): string => {
    return getEnvValue('VITE_GOOGLE_CLIENT_SECRET') || '';
};

/**
 * Validate that all required Google OAuth environment variables are set 
 * Validates in both development and production with detailed logging
 */
export const validateGoogleOAuthConfig = (): void => {
    const missingVars: string[] = [];
    
    console.log('Build ENV:', buildEnvMap);
    
    const clientId = getEnvValue('VITE_GOOGLE_CLIENT_ID');
    const clientSecret = getEnvValue('VITE_GOOGLE_CLIENT_SECRET');
    const redirectUri = getEnvValue('VITE_GOOGLE_REDIRECT_URI');
    
    console.log('Resolved Values:', {
        clientId: clientId ? `${clientId.substring(0, 20)}...` : 'MISSING',
        clientSecret: clientSecret ? 'SET' : 'MISSING',
        redirectUri: redirectUri || 'MISSING'
    });
    
    if (!clientId) {
        missingVars.push('VITE_GOOGLE_CLIENT_ID');
    }
    
    if (!clientSecret) {
        missingVars.push('VITE_GOOGLE_CLIENT_SECRET');
    }
    
    if (!redirectUri) {
        missingVars.push('VITE_GOOGLE_REDIRECT_URI');
    }
    
    if (missingVars.length > 0) {
        console.error(`❌ Missing Google OAuth environment variables: ${missingVars.join(', ')}`);
        console.error('Please ensure these are set in your environment configuration.');
    } else {
        console.log('✅ All Google OAuth environment variables are set');
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
    console.log('🔧 Generating Google Auth URL...');
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
    
    console.log('✅ Building OAuth URL with client ID:', clientId.substring(0, 20) + '...');
    
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
    console.log('✅ Generated auth URL successfully');
    return authUrl;
};

/**
 * Generate random state for OAuth security
 */
export const generateRandomState = (): string => {
    return btoa(crypto.getRandomValues(new Uint8Array(32)).toString());
};

/**
 * Exchange authorization code for access token save in backend using JWT
 */
export const exchangeCodeForToken = async (code: string): Promise<GoogleOAuthResponse> => {
    const clientSecret = getGoogleClientSecret();
    
    if (!clientSecret) {
        throw new Error('Google Client Secret is not configured. Please add VITE_GOOGLE_CLIENT_SECRET to your environment configuration.');
    }

    console.log('🔧 Exchanging code for token with Google...');
    
    try {
        const response = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: googleOAuthConfig.clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: googleOAuthConfig.redirectUri,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Token exchange failed:', response.status, errorText);
            throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
        }

        const tokenData = await response.json();
        console.log('✅ Token exchange successful');
        return tokenData;
        
    } catch (error) {
        console.error('❌ Error during token exchange:', error);
        throw error;
    }
};

/**
 * Get user info from Google
 */
export const getGoogleUserInfo = async (accessToken: string): Promise<GoogleUser> => {
    console.log('🔧 Getting user info from Google...');
    
    try {
        const response = await fetch(`${GOOGLE_USER_INFO_URL}?access_token=${accessToken}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Failed to get user info:', response.status, errorText);
            throw new Error(`Failed to get user info from Google: ${response.status} ${errorText}`);
        }

        const userData = await response.json();
        console.log('✅ User info retrieved successfully');
        return userData;
        
    } catch (error) {
        console.error('❌ Error getting user info:', error);
        throw error;
    }
};
