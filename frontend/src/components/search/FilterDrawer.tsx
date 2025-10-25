import React from 'react';
import SearchFilters from './SearchFilters';
import type { SearchFilters as SearchFiltersType } from './AdvancedSearch';
import type { FilterOptions } from '../../services/searchService';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: SearchFiltersType;
    filterOptions: FilterOptions;
    onFilterChange: (updates: Partial<SearchFiltersType>) => void;
    onReset: () => void;
    onApply?: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
    isOpen,
    onClose,
    filters,
    filterOptions,
    onFilterChange,
    onReset,
    onApply,
}) => {
    const handleApply = () => {
        onApply?.();
        onClose();
    };

    const handleReset = () => {
        onReset();
        // Don't close drawer, let user continue adjusting
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-base/80 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className="fixed inset-y-0 left-0 w-full max-w-sm bg-surface-glass backdrop-blur-glass border-r border-subtle z-50 shadow-2xl overflow-y-auto"
                style={{
                    animation: 'slideIn 0.3s ease-out',
                }}
            >
                {/* Header */}
                <div className="sticky top-0 bg-base/95 backdrop-blur-glass border-b border-subtle z-10">
                    <div className="flex items-center justify-between p-4">
                        <h2 className="text-xl font-bold text-primary">Filters</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-surface-glass transition-colors click-scale"
                            aria-label="Close filters"
                        >
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Filters Content */}
                <div className="p-4">
                    <SearchFilters
                        filters={filters}
                        filterOptions={filterOptions}
                        onFilterChange={onFilterChange}
                        onReset={handleReset}
                    />
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-base/95 backdrop-blur-glass border-t border-subtle p-4">
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-6 py-3 bg-surface-glass border border-subtle rounded-xl text-primary font-semibold hover:border-pulse transition-all click-scale"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 px-6 py-3 bg-pulse hover:bg-accent-amber text-pulse-fg rounded-xl font-semibold transition-all click-scale"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(-100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </>
    );
};

export default FilterDrawer;
