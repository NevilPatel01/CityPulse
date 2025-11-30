import React, { useState } from 'react';
import type { SearchFilters as SearchFiltersType } from './AdvancedSearch';
import type { FilterOptions } from '../../services/searchService';

interface SearchFiltersProps {
    filters: SearchFiltersType;
    filterOptions: FilterOptions;
    onFilterChange: (updates: Partial<SearchFiltersType>) => void;
    onReset: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
    filters,
    filterOptions,
    onFilterChange,
    onReset
}) => {
    const [expandedSections, setExpandedSections] = useState({
        location: true,
        categories: true,
        tags: true,
        price: true,
        rating: true,
        difficulty: true,
        date: false
    });
    const [showAllCategories, setShowAllCategories] = useState(false);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCategoryToggle = (categoryId: number) => {
        const categoryIdStr = categoryId.toString();
        const newCategories = filters.categories.includes(categoryIdStr)
            ? filters.categories.filter(id => id !== categoryIdStr)
            : [...filters.categories, categoryIdStr];
        onFilterChange({ categories: newCategories });
    };

    const handleLocationToggle = (cityId: number) => {
        const cityIdStr = cityId.toString();
        const newLocations = filters.location.includes(cityIdStr)
            ? filters.location.filter(id => id !== cityIdStr)
            : [...filters.location, cityIdStr];
        onFilterChange({ location: newLocations });
    };

    const handleTagToggle = (tagId: number) => {
        const tagIdStr = tagId.toString();
        const newTags = filters.tags.includes(tagIdStr)
            ? filters.tags.filter(id => id !== tagIdStr)
            : [...filters.tags, tagIdStr];
        onFilterChange({ tags: newTags });
    };

    // Price range validation - min cannot exceed max
    const handlePriceMinChange = (value: number) => {
        if (value <= filters.priceMax) {
            onFilterChange({ priceMin: value });
        } else {
            onFilterChange({ priceMin: filters.priceMax });
        }
    };

    const handlePriceMaxChange = (value: number) => {
        if (value >= filters.priceMin) {
            onFilterChange({ priceMax: value });
        } else {
            onFilterChange({ priceMax: filters.priceMin });
        }
    };

    const hasActiveFilters = filters.categories.length > 0 || 
                            filters.location.length > 0 ||
                            filters.tags.length > 0 ||
                            filters.priceMin > 0 ||
                            filters.priceMax < 1000 ||
                            filters.minRating > 0 ||
                            (filters.difficulty && filters.difficulty !== 'any') ||
                            filters.dateFrom || 
                            filters.dateTo;

    return (
        <div className="bg-surface-glass backdrop-blur-glass rounded-2xl border border-subtle p-6 shadow-glass">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Filters
                </h2>
                {hasActiveFilters && (
                    <button
                        onClick={onReset}
                        className="text-sm text-pulse hover:text-accent-amber transition-colors click-scale"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {/* Location Filter */}
                <FilterSection
                    title="Location"
                    isExpanded={expandedSections.location}
                    onToggle={() => toggleSection('location')}
                    count={filters.location.length}
                >
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-glass cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={filters.location.length === 0}
                                onChange={() => onFilterChange({ location: [] })}
                                className="w-4 h-4 rounded border-subtle text-pulse focus:ring-pulse focus:ring-offset-0"
                            />
                            <span className="text-sm text-primary">Any Location</span>
                        </label>
                        
                        {/* User's Traveled Cities */}
                        {filterOptions.cities.some(c => c.userVisited) && (
                            <>
                                <div className="text-xs text-pulse font-semibold uppercase tracking-wide mt-3 mb-2 px-2">
                                    Your Cities
                                </div>
                                {filterOptions.cities.filter(c => c.userVisited).map(city => (
                                    <label
                                        key={city.id}
                                        className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-surface-glass cursor-pointer transition-colors border-l-2 border-pulse"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={filters.location.includes(city.id.toString())}
                                                onChange={() => handleLocationToggle(city.id)}
                                                className="w-4 h-4 rounded border-subtle text-pulse focus:ring-pulse focus:ring-offset-0 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-primary block truncate">{city.name}</span>
                                                <span className="text-xs text-muted">{city.country}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted flex-shrink-0">{city.recommendationsCount}</span>
                                    </label>
                                ))}
                                <div className="text-xs text-muted font-semibold uppercase tracking-wide mt-3 mb-2 px-2">
                                    All Cities
                                </div>
                            </>
                        )}
                        
                        {/* All Cities */}
                        {filterOptions.cities.filter(c => !c.userVisited).map(city => (
                            <label
                                key={city.id}
                                className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-surface-glass cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={filters.location.includes(city.id.toString())}
                                        onChange={() => handleLocationToggle(city.id)}
                                        className="w-4 h-4 rounded border-subtle text-pulse focus:ring-pulse focus:ring-offset-0 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-primary block truncate">{city.name}</span>
                                        <span className="text-xs text-muted">{city.country}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-muted flex-shrink-0">{city.recommendationsCount}</span>
                            </label>
                        ))}
                        
                        {/* Add New City Button */}
                        <button
                            onClick={() => {
                                // TODO: Open modal to add new city
                                alert('Add new city feature coming soon! For now, create a recommendation in that city.');
                            }}
                            className="w-full flex items-center gap-2 p-2 mt-2 rounded-lg border-2 border-dashed border-subtle hover:border-pulse text-muted hover:text-pulse transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-sm font-medium">Add New City</span>
                        </button>
                    </div>
                </FilterSection>

                {/* Categories Filter */}
                <FilterSection
                    title="Categories"
                    isExpanded={expandedSections.categories}
                    onToggle={() => toggleSection('categories')}
                    count={filters.categories.length}
                >
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            {filterOptions.categories.slice(0, showAllCategories ? filterOptions.categories.length : 4).map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryToggle(category.id)}
                                    className={`p-3 rounded-lg border transition-all click-scale text-left ${
                                        filters.categories.includes(category.id.toString())
                                            ? 'bg-pulse border-pulse text-pulse-fg'
                                            : 'bg-surface-glass border-subtle text-primary hover:border-pulse'
                                    }`}
                                >
                                    <span className="text-sm font-medium block truncate">{category.name}</span>
                                </button>
                            ))}
                        </div>
                        {filterOptions.categories.length > 4 && (
                            <button
                                onClick={() => setShowAllCategories(!showAllCategories)}
                                className="w-full py-2 text-sm text-pulse hover:text-accent-amber transition-colors"
                            >
                                {showAllCategories ? 'Show Less' : `Show More (${filterOptions.categories.length - 4} more)`}
                            </button>
                        )}
                    </div>
                </FilterSection>

                {/* Tags Filter */}
                <FilterSection
                    title="Tags"
                    isExpanded={expandedSections.tags}
                    onToggle={() => toggleSection('tags')}
                    count={filters.tags.length}
                >
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                        {filterOptions.tags.map(tag => (
                            <label
                                key={tag.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-glass cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.tags.includes(tag.id.toString())}
                                    onChange={() => handleTagToggle(tag.id)}
                                    className="w-4 h-4 rounded border-subtle text-pulse focus:ring-pulse focus:ring-offset-0"
                                />
                                <span className="text-sm text-primary">{tag.name}</span>
                            </label>
                        ))}
                        {filterOptions.tags.length === 0 && (
                            <p className="text-sm text-muted text-center py-4">No tags available</p>
                        )}
                    </div>
                </FilterSection>

                {/* Price Range Filter */}
                <FilterSection
                    title="Price Range"
                    isExpanded={expandedSections.price}
                    onToggle={() => toggleSection('price')}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted">Min: ${filters.priceMin}</span>
                            <span className="text-muted">Max: ${filters.priceMax}</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted mb-1 block">Minimum Price</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1000"
                                    step="50"
                                    value={filters.priceMin}
                                    onChange={(e) => handlePriceMinChange(parseInt(e.target.value))}
                                    className="w-full h-2 bg-surface-glass rounded-lg appearance-none cursor-pointer accent-pulse"
                                    style={{
                                        background: `linear-gradient(to right, var(--pulse) 0%, var(--pulse) ${(filters.priceMin / 1000) * 100}%, rgba(255,255,255,0.1) ${(filters.priceMin / 1000) * 100}%, rgba(255,255,255,0.1) 100%)`
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted mb-1 block">Maximum Price</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1000"
                                    step="50"
                                    value={filters.priceMax}
                                    onChange={(e) => handlePriceMaxChange(parseInt(e.target.value))}
                                    className="w-full h-2 bg-surface-glass rounded-lg appearance-none cursor-pointer accent-pulse"
                                    style={{
                                        background: `linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) ${(filters.priceMax / 1000) * 100}%, var(--pulse) ${(filters.priceMax / 1000) * 100}%, var(--pulse) 100%)`
                                    }}
                                />
                            </div>
                        </div>
                        <div className="text-xs text-center text-pulse font-semibold">
                            ${filters.priceMin} - ${filters.priceMax}
                        </div>
                    </div>
                </FilterSection>

                {/* Minimum Rating Filter */}
                <FilterSection
                    title="Minimum Rating"
                    isExpanded={expandedSections.rating}
                    onToggle={() => toggleSection('rating')}
                >
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                            <button
                                key={rating}
                                onClick={() => onFilterChange({ minRating: filters.minRating === rating ? 0 : rating })}
                                className={`flex-1 py-2 rounded-lg border transition-all click-scale ${
                                    filters.minRating === rating
                                        ? 'bg-pulse border-pulse text-pulse-fg'
                                        : 'bg-surface-glass border-subtle text-primary hover:border-pulse'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-sm font-semibold">{rating}</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </FilterSection>

                {/* Difficulty Filter */}
                <FilterSection
                    title="Difficulty"
                    isExpanded={expandedSections.difficulty}
                    onToggle={() => toggleSection('difficulty')}
                >
                    <div className="space-y-2">
                        {['any', 'easy', 'moderate', 'hard', 'expert'].map(level => (
                            <label
                                key={level}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-glass cursor-pointer transition-colors"
                            >
                                <input
                                    type="radio"
                                    name="difficulty"
                                    checked={filters.difficulty === level}
                                    onChange={() => onFilterChange({ difficulty: level })}
                                    className="w-4 h-4 text-pulse focus:ring-pulse focus:ring-offset-0"
                                />
                                <span className="text-sm text-primary capitalize">{level === 'any' ? 'Any Difficulty' : level}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Date Range Filter */}
                <FilterSection
                    title="Date Range"
                    isExpanded={expandedSections.date}
                    onToggle={() => toggleSection('date')}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted">From</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                                className="w-full px-3 py-2 bg-surface-glass border border-subtle rounded-lg text-primary focus:outline-none focus:border-pulse transition-colors [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted">To</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                                className="w-full px-3 py-2 bg-surface-glass border border-subtle rounded-lg text-primary focus:outline-none focus:border-pulse transition-colors [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted">Filter by</label>
                            <select
                                value={filters.dateType}
                                onChange={(e) => onFilterChange({ dateType: e.target.value as 'created' | 'best_time' | 'both' })}
                                className="w-full px-3 py-2 bg-surface-glass border border-subtle rounded-lg text-primary focus:outline-none focus:border-pulse transition-colors [color-scheme:dark]"
                            >
                                <option value="both">Both</option>
                                <option value="created">Created Date</option>
                                <option value="best_time">Best Time to Visit</option>
                            </select>
                        </div>
                    </div>
                </FilterSection>
            </div>
        </div>
    );
};

// Filter Section Component
interface FilterSectionProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    count?: number;
    children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
    title,
    isExpanded,
    onToggle,
    count,
    children
}) => {
    return (
        <div className="border-b border-subtle pb-6 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between mb-4 text-left group"
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">{title}</span>
                    {count !== undefined && count > 0 && (
                        <span className="px-2 py-0.5 bg-pulse text-pulse-fg text-xs font-semibold rounded-full">
                            {count}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-muted group-hover:text-primary transition-all ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && <div className="animate-fadeIn">{children}</div>}
        </div>
    );
};

export default SearchFilters;
