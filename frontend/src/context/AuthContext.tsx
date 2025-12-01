import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { apiEndpoints, apiRequest } from '../config/api';
import { useSafeToast } from '../hooks/useSafeToast';
import { getAuthToken, setAuthToken as storeAuthToken, removeAuthToken } from '../utils/authStorage';

// User interface
export interface User {
    id: string;
    email: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    createdAt?: string;
    role?: string;
}

// Auth context interface
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    checkAuthStatus: () => Promise<void>;
}

// Registration data interface
interface RegisterData {
    email: string;
    password: string;
    username: string;
    fullName: string;
}

// API response interfaces
interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
}

interface UserProfileResponse {
    success: boolean;
    data: {
        user: User;
    };
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { showSuccess, showError } = useSafeToast();

    // Check if user is authenticated
    // User must exist AND token must be present
    // During loading, we don't check authentication to allow auth verification to complete
    const isAuthenticated = !isLoading && !!user && !!getAuthToken();

    // Check authentication status
    const checkAuthStatus = useCallback(async () => {
        try {
            // Get token from storage utility (checks both storages)
            // This syncs localStorage to sessionStorage if needed for cross-tab access
            const token = getAuthToken();
            
            if (!token) {
                console.log('[AUTH] No token found in storage');
                setIsLoading(false);
                return;
            }

            console.log('[AUTH] Token found, verifying with server...');
            // Verify token and get user data
            const data = await apiRequest<UserProfileResponse>(
                apiEndpoints.auth.profile,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            console.log('✅ [AUTH] Token valid, user authenticated:', data.data.user.email);
            setUser(data.data.user);
        } catch (error: any) {
            // Token is invalid or expired
            console.error('❌ [AUTH] Auth check failed:', error);
            
            // Only remove token if it's actually an auth error (401, 403)
            // Don't remove on network errors - user might just be offline
            if (error?.status === 401 || error?.status === 403) {
                console.log('[AUTH] Token invalid or expired, removing from storage');
                removeAuthToken();
                setUser(null);
            } else {
                // For network errors, keep the token but mark as not authenticated
                // User can retry when network is back
                console.log('[AUTH] Network error during auth check, keeping token');
                setUser(null);
            }
        } finally {
            console.log('🏁 [AUTH] Auth check complete, loading finished');
            setIsLoading(false);
        }
    }, []);

    // Check authentication status on app start and listen for storage changes
    useEffect(() => {
        checkAuthStatus();
        
        // Listen for storage changes from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'authToken') {
                console.log('[AUTH] Storage change detected from another tab/window');
                // If token was removed (logout), clear user state
                if (!e.newValue) {
                    setUser(null);
                } else {
                    // If token was added, verify and update user state
                    checkAuthStatus();
                }
            }
        };
        
        // Listen for custom auth token change events (from same origin)
        const handleAuthTokenChange = (e: CustomEvent) => {
            console.log('[AUTH] Auth token change event detected');
            if (e.detail.token) {
                // Token was set, verify it
                checkAuthStatus();
            } else {
                // Token was removed (logout)
                setUser(null);
            }
        };
        
        // Add event listeners
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('authTokenChanged', handleAuthTokenChange as EventListener);
        
        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authTokenChanged', handleAuthTokenChange as EventListener);
        };
    }, [checkAuthStatus]);

    // Login function
    const login = async (email: string, password: string, rememberMe: boolean = false) => {
        try {
            const data = await apiRequest<AuthResponse>(apiEndpoints.auth.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('[AUTH] Login successful for:', data.data.user.email);
            
            // Store token using utility function (handles both storages and cross-tab sync)
            storeAuthToken(data.data.accessToken, rememberMe);
            
            setUser(data.data.user);
            
            // Show success toast
            showSuccess(
                'Welcome back!',
                `Hello ${data.data.user.fullName}, you've successfully logged in.`,
                4000
            );
        } catch (error) {
            console.error('[AUTH] Login failed:', error);
            showError(
                'Login Failed',
                'Invalid email or password. Please try again.',
                5000
            );
            throw error;
        }
    };

    // Register function
    const register = async (userData: RegisterData) => {
        try {
            const data = await apiRequest<AuthResponse>(apiEndpoints.auth.register, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            console.log('[AUTH] Registration successful for:', data.data.user.email);

            // Store token using utility function (default to sessionStorage for new registrations)
            storeAuthToken(data.data.accessToken, false);
            setUser(data.data.user);
            
            // Show success toast
            showSuccess(
                'Account Created!',
                `Welcome to CityPulse, ${data.data.user.fullName}! Your account has been created successfully.`,
                5000
            );
        } catch (error) {
            console.error('[AUTH] Registration failed:', error);
            showError(
                'Registration Failed',
                'Unable to create account. Please try again.',
                5000
            );
            throw error;
        }
    };

    // Logout function
    const logout = () => {
        console.log(' [AUTH] User logging out:', user?.email);
        const userName = user?.fullName || 'User';
        
        // Clear token from all storages using utility function (notifies other tabs)
        removeAuthToken();
        setUser(null);
        
        // Show success toast
        showSuccess(
            'Logged Out Successfully',
            `See you later ${userName}! You've been logged out successfully.`,
            3000
        );
        
        // Optionally call logout endpoint to invalidate token on server
    };

    // Update user function
    const updateUser = (userData: Partial<User>) => {
        console.log(' [AUTH] Updating user data:', userData);
        
        if (user) {
            setUser({ ...user, ...userData });
        } else if (userData.id) {
            // If no existing user but we have complete user data, set it directly. in such cases like after registration
            setUser(userData as User);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        checkAuthStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
