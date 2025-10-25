import { useEffect } from 'react';
import { useSearchOverlay } from '../../context/SearchOverlayContext';
import AdvancedSearch from './AdvancedSearch';

const GlobalSearchOverlay = () => {
    const { isOpen, closeSearch } = useSearchOverlay();

    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                closeSearch();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, closeSearch]);

    // Open overlay if on search page
    useEffect(() => {
        if (window.location.pathname === '/search') {
            // Don't auto-open, just show inline
        }
    }, []);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop Blur */}
            <div
                className="fixed inset-0 bg-base/80 backdrop-blur-md z-40 transition-opacity duration-300"
                onClick={closeSearch}
                style={{ backdropFilter: 'blur(8px)' }}
            />

            {/* Overlay Container */}
            <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-4 px-4">
                <div 
                    className="w-full max-w-7xl bg-base rounded-2xl shadow-2xl border border-subtle max-h-[95vh] overflow-y-auto animate-slideUp"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeSearch}
                        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-surface-glass hover:bg-pulse/10 border border-subtle transition-all click-scale"
                        aria-label="Close search"
                    >
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Advanced Search Component */}
                    <div className="p-6">
                        <AdvancedSearch />
                    </div>
                </div>
            </div>

            {/* Animation Styles */}
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default GlobalSearchOverlay;
