import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    action: () => void;
    description: string;
}

interface UseKeyboardNavigationProps {
    shortcuts?: KeyboardShortcut[];
    trapFocus?: boolean;
    restoreFocus?: boolean;
}

export const useKeyboardNavigation = ({
    shortcuts = [],
    trapFocus = false,
    restoreFocus = false,
}: UseKeyboardNavigationProps = {}) => {
    const containerRef = useRef<HTMLElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const {
                    key,
                    ctrlKey = false,
                    shiftKey = false,
                    altKey = false,
                    metaKey = false,
                    action,
                } = shortcut;

                if (
                    event.key === key &&
                    event.ctrlKey === ctrlKey &&
                    event.shiftKey === shiftKey &&
                    event.altKey === altKey &&
                    event.metaKey === metaKey
                ) {
                    event.preventDefault();
                    action();
                    return;
                }
            }
        },
        [shortcuts]
    );

    // Focus management
    const focusFirstElement = useCallback(() => {
        if (!containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        if (firstElement) {
            firstElement.focus();
        }
    }, []);

    const focusLastElement = useCallback(() => {
        if (!containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        if (lastElement) {
            lastElement.focus();
        }
    }, []);

    // Focus trap implementation
    const handleFocusTrap = useCallback(
        (event: KeyboardEvent) => {
            if (!trapFocus || !containerRef.current || event.key !== 'Tab') return;

            const focusableElements = containerRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        },
        [trapFocus]
    );

    // Set up event listeners
    useEffect(() => {
        if (shortcuts.length > 0) {
            document.addEventListener('keydown', handleKeyDown);
        }

        if (trapFocus) {
            document.addEventListener('keydown', handleFocusTrap);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keydown', handleFocusTrap);
        };
    }, [handleKeyDown, handleFocusTrap, shortcuts.length, trapFocus]);

    // Store previous focus when component mounts
    useEffect(() => {
        if (restoreFocus) {
            previousFocusRef.current = document.activeElement as HTMLElement;
        }

        return () => {
            if (restoreFocus && previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        };
    }, [restoreFocus]);

    // Helper to announce keyboard shortcuts to screen readers
    const announceShortcuts = useCallback(() => {
        if (shortcuts.length === 0) return;

        const shortcutsList = shortcuts
            .map((shortcut) => {
                const keys = [];
                if (shortcut.ctrlKey) keys.push('Ctrl');
                if (shortcut.shiftKey) keys.push('Shift');
                if (shortcut.altKey) keys.push('Alt');
                if (shortcut.metaKey) keys.push('Cmd');
                keys.push(shortcut.key);

                return `${keys.join(' + ')}: ${shortcut.description}`;
            })
            .join('. ');

        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `Available keyboard shortcuts: ${shortcutsList}`;

        document.body.appendChild(announcement);

        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 5000);
    }, [shortcuts]);

    return {
        containerRef,
        focusFirstElement,
        focusLastElement,
        announceShortcuts,
    };
};

export default useKeyboardNavigation;