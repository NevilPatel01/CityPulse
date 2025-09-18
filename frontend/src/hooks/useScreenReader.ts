import { useCallback } from 'react';

type AnnouncementType = 'polite' | 'assertive';

export const useScreenReader = () => {
    const announce = useCallback((message: string, type: AnnouncementType = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', type);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        // Remove the announcement after it's been read
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, type === 'assertive' ? 3000 : 1000);
    }, []);

    const announcePolite = useCallback((message: string) => {
        announce(message, 'polite');
    }, [announce]);

    const announceAssertive = useCallback((message: string) => {
        announce(message, 'assertive');
    }, [announce]);

    return {
        announce,
        announcePolite,
        announceAssertive,
    };
};

export default useScreenReader;