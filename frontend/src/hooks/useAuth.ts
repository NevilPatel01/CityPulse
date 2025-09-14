import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Hook for checking if route should be protected
export const useAuthGuard = () => {
    const { isAuthenticated, isLoading } = useAuth();

    return {
        isAuthenticated,
        isLoading,
        shouldRedirectToLogin: !isLoading && !isAuthenticated,
        shouldRedirectToDashboard: !isLoading && isAuthenticated,
    };
};