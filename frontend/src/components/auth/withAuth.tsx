import React from 'react';
import { useAuth } from '../../hooks/useAuth';

// Higher-order component for protected routes based on authentication status of the user
export const withAuth = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
): React.FC<P> => {
    return (props: P) => {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className='min-h-screen bg-primary flex items-center justify-center'>
                    <div className='glass-card p-8 rounded-xl'>
                        <div className='flex items-center space-x-4'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-pulse'></div>
                            <span className='text-primary'>Loading...</span>
                        </div>
                    </div>
                </div>
            );
        }

        if (!isAuthenticated) {
            // Redirect to login page
            window.location.href = '/login';
            return null;
        }

        return <WrappedComponent {...props} />;
    };
};
