import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  className = '', 
  placeholder = "Search places, friends, or experiences...",
  isMobile = false,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus when expanded (mobile)
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      if (isMobile) {
        setIsExpanded(false);
        onClose?.();
      }
    }
  };

  // Handle mobile expand/collapse
  const handleMobileToggle = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
      if (!isExpanded) {
        // Will expand - focus will be handled by useEffect
      } else {
        // Will collapse
        setQuery('');
        onClose?.();
      }
    }
  };

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isMobile) {
      setIsExpanded(false);
      setQuery('');
      onClose?.();
    }
  };

  if (isMobile) {
    return (
      <>
        {!isExpanded ? (
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
        ) : (
          // Mobile expanded search bar
          <div className="fixed inset-0 z-50 bg-base">
            <div className="flex items-center p-4 border-b border-subtle">
              <button
                onClick={handleMobileToggle}
                className="p-2 rounded-md hover:bg-surface-glass transition-colors duration-200 mr-3"
                aria-label="Close search"
              >
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full bg-surface-glass border border-subtle rounded-lg px-4 py-3 pr-12 text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md hover:bg-pulse/10 transition-colors duration-200"
                    aria-label="Search"
                  >
                    <svg className="w-5 h-5 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop search bar
  return (
    <form onSubmit={handleSearch} className={`flex-1 max-w-2xl mx-8 ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface-glass border border-subtle rounded-lg px-6 py-3 pr-12 text-base text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse transition-all duration-200 hover:border-pulse/50"
        />
        <button
          type="submit"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-md hover:bg-pulse/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2"
          aria-label="Search"
        >
          <svg className="w-5 h-5 text-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
};