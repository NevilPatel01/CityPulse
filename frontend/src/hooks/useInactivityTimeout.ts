import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSafeToast } from './useSafeToast';

interface UseInactivityTimeoutOptions {
    timeout?: number; // Timeout in milliseconds (default: 15 minutes)
    warningTime?: number; // Show warning before timeout (default: 2 minutes before)
    onWarning?: () => void;
    onTimeout?: () => void;
}

/**
 * Hook to handle user inactivity timeout
 * Automatically logs out user after specified period of inactivity
 */
export const useInactivityTimeout = (options: UseInactivityTimeoutOptions = {}) => {
    const {
        timeout = 15 * 60 * 1000, // 15 minutes
        warningTime = 2 * 60 * 1000, // 2 minutes before timeout
        onWarning,
        onTimeout
    } = options;

    const { logout, isAuthenticated } = useAuth();
    const { showWarning } = useSafeToast();

    const timeoutRef = useRef<number | null>(null);
    const warningRef = useRef<number | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const clearTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
            warningRef.current = null;
        }
    }, []);

    const handleTimeout = useCallback(async () => {
        console.log('[INACTIVITY] Session timeout - logging out user');

        if (onTimeout) {
            onTimeout();
        }

        await logout();

        showWarning(
            'Session Expired',
            'You have been logged out due to inactivity.',
            5000
        );
    }, [logout, onTimeout, showWarning]);

    const handleWarning = useCallback(() => {
        console.log('[INACTIVITY] Showing timeout warning');

        if (onWarning) {
            onWarning();
        } else {
            showWarning(
                'Session Expiring Soon',
                'Your session will expire in 2 minutes due to inactivity. Move your mouse or press a key to stay logged in.',
                10000
            );
        }
    }, [onWarning, showWarning]);

    const resetTimer = useCallback(() => {
        if (!isAuthenticated) return;

        const now = Date.now();
        lastActivityRef.current = now;

        clearTimers();

        // Set warning timer
        warningRef.current = setTimeout(handleWarning, timeout - warningTime);

        // Set timeout timer
        timeoutRef.current = setTimeout(handleTimeout, timeout);

        console.log('[INACTIVITY] Timer reset - will timeout in', timeout / 1000 / 60, 'minutes');
    }, [isAuthenticated, timeout, warningTime, handleWarning, handleTimeout, clearTimers]);

    useEffect(() => {
        if (!isAuthenticated) {
            clearTimers();
            return;
        }

        // Events that indicate user activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Throttle activity detection to avoid excessive timer resets
        let throttleTimeout: number | null = null;
        const throttledResetTimer = () => {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    resetTimer();
                    throttleTimeout = null;
                }, 1000); // Throttle to once per second
            }
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, throttledResetTimer);
        });

        // Initial timer setup
        resetTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, throttledResetTimer);
            });
            clearTimers();
            if (throttleTimeout) {
                clearTimeout(throttleTimeout);
            }
        };
    }, [isAuthenticated, resetTimer, clearTimers]);

    return {
        resetTimer,
        lastActivity: lastActivityRef.current
    };
};
