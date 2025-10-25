import React, { useState, useRef, useEffect } from 'react';
import { useSearchOverlay } from '../../context/SearchOverlayContext';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  className = '', 
  placeholder = "Search places, friends, or experiences...",
  isMobile = false
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded] = useState(!isMobile);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openSearch } = useSearchOverlay();

  // Auto-focus when expanded (mobile)
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle mobile expand/collapse
  const handleMobileToggle = () => {
    openSearch(); // Open the global overlay instead
  };

  if (isMobile) {
    return (
      // Mobile search icon button
      <button
        onClick={handleMobileToggle}
        className="p-3 rounded-md hover:bg-surface-glass transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Search"
      >
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    );
  }

  // Desktop search bar
  return (
    <div 
      onClick={openSearch}
      className={`flex-1 max-w-2xl mx-8 cursor-pointer ${className}`}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={(e) => {
            e.stopPropagation();
            openSearch();
          }}
          placeholder={placeholder}
          readOnly
          className="w-full bg-surface-glass border border-subtle rounded-lg px-6 py-3 pr-12 text-base text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse transition-all duration-200 hover:border-pulse/50 cursor-pointer"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openSearch();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-md hover:bg-pulse/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2"
          aria-label="Search"
        >
          <svg className="w-5 h-5 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};