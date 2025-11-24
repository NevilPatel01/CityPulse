import { useInactivityTimeout } from '../../hooks/useInactivityTimeout';

/**
 * Component to handle inactivity timeout
 * Must be inside AuthProvider to access auth context
 */
export const InactivityHandler = () => {
    // Initialize inactivity timeout with 15-minute timeout
    useInactivityTimeout({
        timeout: 15 * 60 * 1000, // 15 minutes
        warningTime: 2 * 60 * 1000, // Show warning 2 minutes before timeout
    });

    return null; // This component doesn't render anything
};
