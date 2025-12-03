import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to scroll to top on route/filter changes
 * Can be used globally or in specific components
 */
export const useScrollToTop = (dependencies?: unknown[]) => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, ...(dependencies || [])]);
};

/**
 * Utility function to scroll to top imperatively
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: 0, behavior });
};

export default useScrollToTop;
