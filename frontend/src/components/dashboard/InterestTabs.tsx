import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '../../config/api';

interface InterestTabsProps {
    selectedInterest: string | null;
    onSelectInterest: (interest: string | null) => void;
}

interface Category {
    id: number;
    name: string;
    description?: string;
}

export const InterestTabs = ({ selectedInterest, onSelectInterest }: InterestTabsProps) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await apiRequest<{ success: boolean; data: Category[] }>('/api/recommendations/categories');
                if (response.success && response.data) {
                    setCategories(response.data);
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    // Check scroll position to show/hide arrows
    const checkScrollPosition = () => {
        if (!scrollContainerRef.current) return;
        
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        checkScrollPosition();

        container.addEventListener('scroll', checkScrollPosition);
        window.addEventListener('resize', checkScrollPosition);

        return () => {
            container.removeEventListener('scroll', checkScrollPosition);
            window.removeEventListener('resize', checkScrollPosition);
        };
    }, [categories]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 300;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    if (loading) {
        return (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-11 bg-white/10 rounded-xl w-36 flex-shrink-0 animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden w-full">
            {/* Left fade and arrow */}
            {showLeftArrow && (
                <>
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-surface-glass to-transparent pointer-events-none z-10 hidden md:block" />
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-surface-glass/95 backdrop-blur-md border border-subtle hover:border-pulse transition-all shadow-lg hidden md:flex items-center justify-center"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft size={18} className="text-primary" />
                    </button>
                </>
            )}

            {/* Right fade and arrow */}
            {showRightArrow && (
                <>
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-surface-glass to-transparent pointer-events-none z-10 hidden md:block" />
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-surface-glass/95 backdrop-blur-md border border-subtle hover:border-pulse transition-all shadow-lg hidden md:flex items-center justify-center"
                        aria-label="Scroll right"
                    >
                        <ChevronRight size={18} className="text-primary" />
                    </button>
                </>
            )}

            {/* Scrollable container - constrained width */}
            <div className="overflow-hidden">
                <div
                    ref={scrollContainerRef}
                    className="flex items-center gap-3 overflow-x-auto scrollbar-hide"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        scrollBehavior: 'smooth',
                        width: '100%'
                    }}
                >
                    {/* All button */}
                    <button
                        onClick={() => onSelectInterest(null)}
                        className={`
                            px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap flex-shrink-0
                            transition-all duration-200
                            ${!selectedInterest
                                ? 'bg-pulse text-white shadow-lg' 
                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary border border-subtle'
                            }
                        `}
                    >
                        All
                    </button>

                    {/* Category buttons */}
                    {categories.map((category) => {
                        const isSelected = selectedInterest === category.name;
                        
                        return (
                            <button
                                key={category.id}
                                onClick={() => onSelectInterest(isSelected ? null : category.name)}
                                className={`
                                    px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap flex-shrink-0
                                    transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-pulse text-white shadow-lg' 
                                        : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary border border-subtle'
                                    }
                                `}
                            >
                                {category.name}
                            </button>
                        );
                    })}

                    {/* Clear filter button */}
                    {selectedInterest && (
                        <button
                            onClick={() => onSelectInterest(null)}
                            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center gap-2 font-semibold text-sm"
                        >
                            <X size={16} />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Results count */}
            {selectedInterest && (
                <div className="mt-3 pt-3 border-t border-subtle">
                    <p className="text-xs text-muted text-center">
                        Showing <span className="text-pulse font-semibold">{selectedInterest}</span> recommendations
                    </p>
                </div>
            )}
        </div>
    );
};
