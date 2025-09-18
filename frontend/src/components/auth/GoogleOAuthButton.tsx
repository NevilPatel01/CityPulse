import React from 'react';
import { useGoogleOAuth } from '../../hooks/useGoogleOAuth';

interface GoogleOAuthButtonProps {
    text?: string;
    usePopup?: boolean;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
    text = 'Continue with Google',
    usePopup = false,
}) => {
    const { isLoading, error, initiateGoogleOAuth, loginWithGooglePopup } =
        useGoogleOAuth();

    const handleClick = async () => {
        if (usePopup) {
            try {
                await loginWithGooglePopup();
            } catch (error) {
                console.error('Google OAuth error:', error);
            }
        } else {
            initiateGoogleOAuth();
        }
    };

    const buttonId = `google-oauth-button-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${buttonId}-error` : undefined;

    return (
        <div>
            <button
                id={buttonId}
                type='button'
                onClick={handleClick}
                disabled={isLoading}
                aria-describedby={errorId}
                aria-label={`${text}${isLoading ? ' - Loading' : ''}`}
                className='w-full glass-card border border-subtle/50 rounded-xl p-4 
                   hover:bg-surface-glass/80 transition-all duration-300 
                   hover:border-pulse/30 group disabled:opacity-50 
                   disabled:cursor-not-allowed relative overflow-hidden
                   focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 focus:ring-offset-base'
            >
                {/* Background gradient overlay */}
                <div
                    className='absolute inset-0 bg-gradient-to-r from-transparent via-pulse/5 to-transparent 
                        transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                        transition-transform duration-1000 ease-out'
                    aria-hidden="true"
                />

                <div className='flex items-center justify-center space-x-3 relative z-10'>
                    {/* Google Icon */}
                    <div className='w-5 h-5 relative' aria-hidden="true">
                        <svg 
                            viewBox='0 0 24 24' 
                            className='w-full h-full'
                            role="img"
                            aria-label="Google logo"
                        >
                            <title>Google</title>
                            <path
                                fill='#4285F4'
                                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                            />
                            <path
                                fill='#34A853'
                                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                            />
                            <path
                                fill='#FBBC05'
                                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                            />
                            <path
                                fill='#EA4335'
                                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                            />
                        </svg>
                    </div>

                    {/* Text */}
                    <span className='text-primary font-medium'>
                        {isLoading ? 'Connecting...' : text}
                    </span>

                    {/* Loading spinner */}
                    {isLoading && (
                        <div 
                            className='w-4 h-4 border-2 border-pulse/30 border-t-pulse rounded-full animate-spin'
                            aria-hidden="true" 
                        />
                    )}
                </div>

                {/* Screen reader loading status */}
                {isLoading && (
                    <span className="sr-only">
                        Connecting to Google, please wait...
                    </span>
                )}
            </button>

            {/* Error message */}
            {error && (
                <div 
                    id={errorId}
                    className='mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm'
                    role="alert"
                    aria-live="polite"
                >
                    <div className="flex items-start gap-2">
                        <svg 
                            className="w-4 h-4 mt-0.5 flex-shrink-0" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path 
                                fillRule="evenodd" 
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                                clipRule="evenodd" 
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
