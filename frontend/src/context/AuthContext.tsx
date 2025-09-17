import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiEndpoints, apiRequest } from '../config/api';

// User interface
export interface User {
    id: string;
    email: string;
    username: string;
    fullName: string;
    profilePicture?: string;
    createdAt?: string;
}

// Auth context interface
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
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

    // Check if user is authenticated
    const isAuthenticated = !!user && !!localStorage.getItem('authToken');

    // Check authentication status on app start
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Check authentication status
    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('authToken');
            
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
            setUser(null);
        } finally {
            console.log('🏁 [AUTH] Auth check complete, loading finished');
            setIsLoading(false);
        }
    };

    // Login function
    const login = async (email: string, password: string) => {
        
        const data = await apiRequest<AuthResponse>(apiEndpoints.auth.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        console.log('[AUTH] Login successful for:', data.data.user.email);
        
        // Store token and user data
        localStorage.setItem('authToken', data.data.accessToken);
        setUser(data.data.user);
    };

    // Register function
    const register = async (userData: RegisterData) => {
        
        const data = await apiRequest<AuthResponse>(apiEndpoints.auth.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        console.log('[AUTH] Registration successful for:', data.data.user.email);

        // Store token and user data
        localStorage.setItem('authToken', data.data.accessToken);
        setUser(data.data.user);
    };

    // Logout function
    const logout = () => {
        console.log(' [AUTH] User logging out:', user?.email);
        localStorage.removeItem('authToken');
        setUser(null);
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
