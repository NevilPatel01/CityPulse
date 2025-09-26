import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  onUnauthorized?: () => void;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { requireAuth = true, redirectTo = '/login', onUnauthorized } = options;
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return; // Still loading, don't redirect yet

    if (requireAuth && !isAuthenticated) {
      // User needs to be authenticated but isn't
      console.log('🔒 [AUTH GUARD] User not authenticated, redirecting to login');
      onUnauthorized?.();
      navigate(redirectTo, { 
        state: { from: location },
        replace: true 
      });
    } else if (!requireAuth && isAuthenticated) {
      // User is authenticated but shouldn't be on this page (e.g., login page)
      console.log('🔒 [AUTH GUARD] User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, navigate, location, onUnauthorized]);

  return {
    isAuthenticated,
    isLoading,
    canAccess: requireAuth ? isAuthenticated : !isAuthenticated,
  };
}
