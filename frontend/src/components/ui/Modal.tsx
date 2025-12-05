import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../ui';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    showCloseButton?: boolean;
    className?: string;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
};

// Focus trap hook
const useFocusTrap = (isOpen: boolean, modalRef: React.RefObject<HTMLDivElement | null>) => {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        // Store the previously focused element
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Get all focusable elements in the modal
        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        // Focus the first element
        if (firstElement) {
            firstElement.focus();
        }

        // Handle tab key navigation
        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleTabKey);

        return () => {
            document.removeEventListener('keydown', handleTabKey);
            // Restore focus to previously focused element
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, modalRef]);
};

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    className = '',
    ariaLabelledBy,
    ariaDescribedBy,
    closeOnBackdropClick = true,
    closeOnEscape = true
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const titleId = title ? `modal-title-${Math.random().toString(36).substr(2, 9)}` : ariaLabelledBy;

    // Focus trap
    useFocusTrap(isOpen, modalRef);

    // Handle escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose, closeOnEscape]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Announce modal opening to screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'assertive');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = `Modal opened: ${title || 'Dialog'}`;
            document.body.appendChild(announcement);
            
            setTimeout(() => {
                document.body.removeChild(announcement);
            }, 1000);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, title]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdropClick) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={ariaDescribedBy}
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                aria-hidden="true"
            />

            {/* Modal */}
            <div 
                ref={modalRef}
                className={`
                    relative w-full ${sizeClasses[size]} bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl shadow-glass 
                    transform transition-all duration-300 animate-modal-in max-h-[90vh] overflow-hidden
                    ${className}
                `}
                role="document"
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <header className="flex items-center justify-between p-6 border-b border-subtle">
                        {title && (
                            <h2 
                                id={titleId}
                                className="text-xl font-semibold text-primary"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-muted hover:text-primary hover:bg-surface-glass ml-auto"
                                ariaLabel="Close modal"
                            >
                                <span aria-hidden="true">✕</span>
                            </Button>
                        )}
                    </header>
                )}

                {/* Content */}
                <main className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

// Quick Action Modal Component
interface QuickActionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickActionModal = ({ isOpen, onClose }: QuickActionModalProps) => {
    const quickActions = [
        {
            id: 'connect',
            title: 'Find Locals',
            description: 'Connect with verified locals in your destination',
            icon: '👥',
            color: 'from-blue-500 to-cyan-500',
            action: () => window.location.href = '/feed',
        },
        {
            id: 'recommend',
            title: 'Get Recommendations',
            description: 'Ask for personalized place recommendations',
            icon: '⭐',
            color: 'from-yellow-500 to-orange-500',
            action: () => window.location.href = '/recommendations',
        },
        {
            id: 'checkin',
            title: 'Check In',
            description: 'Share your current location and discoveries',
            icon: '📍',
            color: 'from-green-500 to-emerald-500',
            action: () => window.location.href = '/feed',
        },
        {
            id: 'review',
            title: 'Write Review',
            description: 'Share your experience about a place',
            icon: '📝',
            color: 'from-purple-500 to-pink-500',
            action: () => window.location.href = '/recommendations',
        },
        {
            id: 'plan',
            title: 'Plan Trip',
            description: 'Create itinerary for your next adventure',
            icon: '🗺️',
            color: 'from-indigo-500 to-blue-500',
            action: () => window.location.href = '/trips',
        },
        {
            id: 'chat',
            title: 'Start Chat',
            description: 'Message locals or fellow travelers',
            icon: '💬',
            color: 'from-teal-500 to-cyan-500',
            action: () => window.location.href = '/messages',
        },
    ];

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Quick Actions" 
            size="lg"
            ariaDescribedBy="quick-actions-description"
        >
            <div className="p-6">
                <p 
                    id="quick-actions-description" 
                    className="sr-only"
                >
                    Choose from the following quick actions to interact with CityPulse
                </p>
                <div className="grid md:grid-cols-2 gap-4" role="grid">
                    {quickActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => {
                                action.action();
                                onClose();
                            }}
                            className="group p-4 rounded-xl bg-surface-glass border border-subtle hover:border-pulse/40 hover:shadow-lg transition-all duration-200 text-left"
                            role="gridcell"
                            aria-label={`${action.title}: ${action.description}`}
                            tabIndex={0}
                        >
                            <div className="flex items-start gap-4">
                                <div 
                                    className={`
                                        w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white text-xl
                                        group-hover:scale-110 transition-transform duration-200
                                    `}
                                    aria-hidden="true"
                                >
                                    {action.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-primary group-hover:text-pulse transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted mt-1 leading-relaxed">
                                        {action.description}
                                    </p>
                                </div>
                                <div 
                                    className="text-muted group-hover:text-pulse transition-colors"
                                    aria-hidden="true"
                                >
                                    →
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};