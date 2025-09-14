import { useEffect } from 'react';
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
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
};

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    className = ''
}: ModalProps) => {
    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`
        relative w-full ${sizeClasses[size]} bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl shadow-glass 
        transform transition-all duration-300 animate-modal-in max-h-[90vh] overflow-hidden
        ${className}
      `}>
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 border-b border-subtle">
                        {title && (
                            <h2 className="text-xl font-semibold text-primary">{title}</h2>
                        )}
                        {showCloseButton && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-muted hover:text-primary hover:bg-surface-glass ml-auto"
                            >
                                ✕
                            </Button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                    {children}
                </div>
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
            action: () => console.log('Find locals'),
        },
        {
            id: 'recommend',
            title: 'Get Recommendations',
            description: 'Ask for personalized place recommendations',
            icon: '⭐',
            color: 'from-yellow-500 to-orange-500',
            action: () => console.log('Get recommendations'),
        },
        {
            id: 'checkin',
            title: 'Check In',
            description: 'Share your current location and discoveries',
            icon: '📍',
            color: 'from-green-500 to-emerald-500',
            action: () => console.log('Check in'),
        },
        {
            id: 'review',
            title: 'Write Review',
            description: 'Share your experience about a place',
            icon: '📝',
            color: 'from-purple-500 to-pink-500',
            action: () => console.log('Write review'),
        },
        {
            id: 'plan',
            title: 'Plan Trip',
            description: 'Create itinerary for your next adventure',
            icon: '🗺️',
            color: 'from-indigo-500 to-blue-500',
            action: () => console.log('Plan trip'),
        },
        {
            id: 'chat',
            title: 'Start Chat',
            description: 'Message locals or fellow travelers',
            icon: '💬',
            color: 'from-teal-500 to-cyan-500',
            action: () => console.log('Start chat'),
        },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quick Actions" size="lg">
            <div className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => {
                                action.action();
                                onClose();
                            }}
                            className="group p-4 rounded-xl bg-surface-glass border border-subtle hover:border-pulse/40 hover:shadow-lg transition-all duration-200 text-left"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`
                  w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white text-xl
                  group-hover:scale-110 transition-transform duration-200
                `}>
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
                                <div className="text-muted group-hover:text-pulse transition-colors">
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