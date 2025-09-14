import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGoogleOAuth } from '../../hooks/useGoogleOAuth';

const GoogleOAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleOAuthCallback } = useGoogleOAuth();

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        console.log('🔧 OAuth callback received:', {
            code: !!code,
            state: !!state,
            error,
        });

        if (error) {
            console.error('❌ OAuth error from Google:', error);
            navigate('/login', {
                state: { error: `Google OAuth failed: ${error}` },
            });
            return;
        }

        if (code) {
            console.log('✅ Authorization code received, processing...');
            handleOAuthCallback(code);
        } else {
            console.error('❌ No authorization code received');
            navigate('/login', {
                state: {
                    error: 'Invalid OAuth callback - no authorization code received',
                },
            });
        }
    }, [searchParams, navigate, handleOAuthCallback]);

    return (
        <div className='min-h-screen bg-primary flex items-center justify-center'>
            <div className='glass-card p-8 rounded-xl'>
                <div className='flex items-center space-x-4'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-pulse'></div>
                    <span className='text-primary'>Completing Google sign-in...</span>
                </div>
                <div className='mt-4 text-sm text-gray-400 text-center'>
                    Please wait while we process your authentication...
                </div>
            </div>
        </div>
    );
};

export default GoogleOAuthCallback;
