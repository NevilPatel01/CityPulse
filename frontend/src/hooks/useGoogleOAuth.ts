import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGoogleAuthUrl, googleOAuthConfig } from '../config/googleOAuth';
import { apiEndpoints, apiRequest } from '../config/api';
import { useAuth } from './useAuth';

interface GoogleOAuthState {
    isLoading: boolean;
    error: string | null;
}

interface GoogleAuthResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: string;
            email: string;
            username: string;
            fullName: string;
        };
        accessToken: string;
        refreshToken: string;
    };
}

export const useGoogleOAuth = () => {
    const [state, setState] = useState<GoogleOAuthState>({
        isLoading: false,
        error: null
    });

    const navigate = useNavigate();
    const { updateUser } = useAuth();

    /**
     * Initiate Google OAuth flow
     */
    const initiateGoogleOAuth = useCallback(() => {
        try {
            console.log('[OAUTH] Initiating Google OAuth flow...');
            setState({ isLoading: true, error: null });

            const authUrl = getGoogleAuthUrl();
            console.log('[OAUTH] Generated auth URL:', authUrl);

            // Store the current path to redirect back after OAuth
            sessionStorage.setItem('oauth_redirect_path', window.location.pathname);
            console.log('[OAUTH] Stored redirect path:', window.location.pathname);

            // Open Google OAuth in the same window
            console.log('[OAUTH] Redirecting to Google OAuth...');
            window.location.href = authUrl;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Google OAuth';
            setState({ isLoading: false, error: errorMessage });
        }
    }, []);

    /**
     * Handle OAuth callback (called when user returns from Google)
     */
    const handleOAuthCallback = useCallback(async (code: string) => {
        console.log('🔧 OAuth callback started with code:', code?.substring(0, 20) + '...');

        try {
            setState({ isLoading: true, error: null });

            console.log('Step 1: Sending authorization code to backend...');
            // SECURITY: Send authorization code to backend
            // Backend will exchange code for token using client secret (kept secure on server)
            const authResponse = await apiRequest<GoogleAuthResponse>(
                apiEndpoints.auth.googleOAuth,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: code,
                        redirectUri: googleOAuthConfig.redirectUri
                    }),
                }
            );
            console.log('Backend auth response:', authResponse);

            // Store JWT token and user data in sessionStorage (not localStorage)
            sessionStorage.setItem('authToken', authResponse.data.accessToken);
            console.log('Auth token stored in sessionStorage');

            // Update auth context with the user data
            updateUser(authResponse.data.user);
            console.log('✅ Auth context updated with user data');

            // Get the stored redirect path or default to dashboard
            const redirectPath = sessionStorage.getItem('oauth_redirect_path') || '/dashboard';
            sessionStorage.removeItem('oauth_redirect_path');
            console.log('Redirecting to:', redirectPath);

            // Add a small delay to ensure context update propagates
            setTimeout(() => {
                // Navigate to dashboard
                navigate(redirectPath);
                setState({ isLoading: false, error: null });
                console.log('OAuth flow completed successfully!');
            }, 100);

        } catch (error) {
            console.error('OAuth callback error:', error);
            
            // Handle different types of errors gracefully
            const errorMessage = error instanceof Error ? error.message : 'Google OAuth authentication failed';
            
            if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
                console.log('ℹAd blocker detected - this is normal and won\'t affect login');
                return;
            }
            
            // Handle rate limiting (429 errors)
            if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
                console.error('Rate limit exceeded - too many OAuth attempts');
                setState({ isLoading: false, error: 'Too many login attempts. Please wait a moment and try again.' });
                navigate('/login', {
                    state: { error: 'Too many login attempts. Please wait a few minutes before trying again.' }
                });
                return;
            }
            
            if (errorMessage.includes('CORS') || errorMessage.includes('Access to fetch')) {
                console.error('CORS error detected - backend configuration issue');
                setState({ isLoading: false, error: 'Server configuration error. Please try again.' });
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('net::ERR_FAILED')) {
                console.error('Network error - backend might be down');
                setState({ isLoading: false, error: 'Unable to connect to server. Please try again.' });
            } else {
                setState({ isLoading: false, error: errorMessage });
            }

            // Navigate back to login with error
            navigate('/login', {
                state: { error: errorMessage }
            });
        }
    }, [navigate, updateUser]);

    /**
     * Login with Google OAuth (alternative method using popup)
     */
    const loginWithGooglePopup = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            try {
                setState({ isLoading: true, error: null });

                const authUrl = getGoogleAuthUrl();

                // Open popup window
                const popup = window.open(
                    authUrl,
                    'google-oauth',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                );

                if (!popup) {
                    throw new Error('Failed to open popup window. Please allow popups for this site.');
                }

                // Listen for messages from popup
                const handleMessage = async (event: MessageEvent) => {
                    if (event.origin !== window.location.origin) return;

                    if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
                        window.removeEventListener('message', handleMessage);
                        popup.close();

                        try {
                            await handleOAuthCallback(event.data.code);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
                        window.removeEventListener('message', handleMessage);
                        popup.close();
                        setState({ isLoading: false, error: event.data.error });
                        reject(new Error(event.data.error));
                    }
                };

                window.addEventListener('message', handleMessage);

                // Check if popup was closed manually
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        window.removeEventListener('message', handleMessage);
                        setState({ isLoading: false, error: 'OAuth process was cancelled' });
                        reject(new Error('OAuth process was cancelled'));
                    }
                }, 1000);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to initiate Google OAuth';
                setState({ isLoading: false, error: errorMessage });
                reject(new Error(errorMessage));
            }
        });
    }, [handleOAuthCallback]);

    return {
        ...state,
        initiateGoogleOAuth,
        handleOAuthCallback,
        loginWithGooglePopup,
    };
};