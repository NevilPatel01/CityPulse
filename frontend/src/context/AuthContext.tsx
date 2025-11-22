import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiEndpoints, apiRequest } from '../config/api';
import { useSafeToast } from '../hooks/useSafeToast';

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
    const isAuthenticated = !!user && !!(sessionStorage.getItem('authToken') || localStorage.getItem('authToken'));

    // Check authentication status on app start
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Check authentication status
    const checkAuthStatus = async () => {
        try {
            // Check both localStorage (remember me) and sessionStorage
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            
            if (!token) {
                setIsLoading(false);
                return;
            }

            console.log('[AUTH] Verifying token with server...');
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
        } catch (error) {
            // Token is invalid or expired
            console.error('❌ [AUTH] Auth check failed:', error);
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            setUser(null);
        } finally {
            console.log('🏁 [AUTH] Auth check complete, loading finished');
            setIsLoading(false);
        }
    };

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
            
            // Store token based on rememberMe preference
            if (rememberMe) {
                // Store in localStorage for persistent login
                localStorage.setItem('authToken', data.data.accessToken);
                console.log('[AUTH] Token stored in localStorage (Remember Me enabled)');
            } else {
                // Store in sessionStorage for session-only login
                sessionStorage.setItem('authToken', data.data.accessToken);
                console.log('[AUTH] Token stored in sessionStorage (session only)');
            }
            
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

            // Store token and user data in sessionStorage
            sessionStorage.setItem('authToken', data.data.accessToken);
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
        
        // Clear token from both storages
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
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
