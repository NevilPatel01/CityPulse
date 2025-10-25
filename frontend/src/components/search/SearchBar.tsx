import React, { useState } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    sortBy: string;
    onSortChange: (sortBy: string) => void;
    view: 'grid' | 'list';
    onViewChange: (view: 'grid' | 'list') => void;
    onFilterClick?: () => void;
    showFilters?: boolean;
    resultsCount?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    onSearch,
    sortBy,
    onSortChange,
    view,
    onViewChange,
    onFilterClick,
    showFilters,
    resultsCount = 0
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    const sortOptions = [
        { value: 'relevant', label: 'Most Relevant' },
        { value: 'rating', label: 'Highest Rating' },
        { value: 'recent', label: 'Most Recent' },
        { value: 'price_low', label: 'Price: Low to High' },
        { value: 'price_high', label: 'Price: High to Low' }
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Search Input Row */}
            <div className="flex gap-3 items-center">
                {/* Mobile Filter Button */}
                {showFilters && (
                    <button
                        onClick={onFilterClick}
                        className="lg:hidden flex items-center justify-center w-12 h-12 rounded-xl bg-surface-glass border border-subtle hover:border-pulse transition-all click-scale"
                        aria-label="Open filters"
                    >
                        <svg className="w-5 h-5 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </button>
                )}

                {/* Search Input */}
                <div className={`flex-1 relative ${isFocused ? 'ring-2 ring-pulse ring-opacity-50' : ''} rounded-xl transition-all`}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className={`w-5 h-5 ${isFocused ? 'text-pulse' : 'text-muted'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Search places, food, activities..."
                        className="w-full h-12 pl-12 pr-4 bg-surface-glass border border-subtle rounded-xl text-primary placeholder-muted focus:outline-none focus:border-pulse transition-colors"
                    />
                    {value && (
                        <button
                            onClick={() => onChange('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-primary transition-colors"
                            aria-label="Clear search"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Search Button */}
                <button
                    onClick={onSearch}
                    className="hidden sm:flex items-center gap-2 px-6 h-12 bg-pulse hover:bg-accent-amber text-pulse-fg rounded-xl font-medium transition-all click-scale shadow-glass"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                </button>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-4">
                {/* Results Count */}
                <div className="text-sm text-muted">
                    <span className="text-pulse font-semibold">{resultsCount}</span> results
                </div>

                <div className="flex items-center gap-3">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="appearance-none h-10 pl-4 pr-10 bg-surface-glass border border-subtle rounded-lg text-primary text-sm font-medium cursor-pointer hover:border-pulse transition-colors focus:outline-none focus:border-pulse"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value} className="bg-base">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-surface-glass rounded-lg border border-subtle">
                        <button
                            onClick={() => onViewChange('grid')}
                            className={`p-2 rounded transition-all click-scale ${
                                view === 'grid' 
                                    ? 'bg-pulse text-pulse-fg' 
                                    : 'text-muted hover:text-primary'
                            }`}
                            aria-label="Grid view"
                            title="Grid view"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onViewChange('list')}
                            className={`p-2 rounded transition-all click-scale ${
                                view === 'list' 
                                    ? 'bg-pulse text-pulse-fg' 
                                    : 'text-muted hover:text-primary'
                            }`}
                            aria-label="List view"
                            title="List view"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
