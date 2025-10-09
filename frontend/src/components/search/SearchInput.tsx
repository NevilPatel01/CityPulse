import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SearchInputProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className = '',
  placeholder = "Search places, users, or cities...",
  onSearch
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Update internal state when URL params change
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Update URL and trigger search
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onSearch?.(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    navigate('/search');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-surface-glass border border-subtle rounded-lg px-4 py-3 pr-20 text-base text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse focus:border-pulse transition-all duration-200 hover:border-pulse/50"
        />
        
        {/* Clear button (when there's text) */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-700/50 transition-colors duration-200"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4 text-muted hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Search button */}
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-md hover:bg-pulse/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2"
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