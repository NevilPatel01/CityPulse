import React, { useEffect, useRef, useState } from 'react';
import { searchApi, type SearchHistoryItem } from '../../services/searchService';
import { useToast } from '../../hooks/useToast';

interface SearchHistoryDropdownProps {
    query: string;
    isOpen: boolean;
    onSelect: (query: string, filters?: Record<string, unknown>) => void;
    onClose: () => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    maxItems?: number;
}

const SearchHistoryDropdown: React.FC<SearchHistoryDropdownProps> = ({
    query,
    isOpen,
    onSelect,
    onClose,
    inputRef,
    maxItems = 8
}) => {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [filteredHistory, setFilteredHistory] = useState<SearchHistoryItem[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showSuccess, showError } = useToast();

    // Load search history
    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    // Filter history based on query
    useEffect(() => {
        if (query.trim()) {
            const filtered = history.filter(item =>
                item.searchQuery.toLowerCase().includes(query.toLowerCase())
            ).slice(0, maxItems);
            setFilteredHistory(filtered);
        } else {
            setFilteredHistory(history.slice(0, maxItems));
        }
        setSelectedIndex(-1);
    }, [query, history, maxItems]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose, inputRef]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || filteredHistory.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredHistory.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < filteredHistory.length) {
                        const item = filteredHistory[selectedIndex];
                        onSelect(item.searchQuery, item.filtersApplied || undefined);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, filteredHistory, selectedIndex, onSelect, onClose]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const response = await searchApi.getSearchHistory(50, 0);
            setHistory(response.history);
        } catch (error) {
            console.error('Failed to load search history:', error);
            // Don't show error toast for history loading failures
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, itemId: number) => {
        e.stopPropagation();
        try {
            await searchApi.deleteSearchHistoryItem(itemId);
            setHistory(prev => prev.filter(item => item.id !== itemId));
            showSuccess('Search history item deleted');
        } catch (error) {
            console.error('Failed to delete search history item:', error);
            showError('Failed to delete search history item');
        }
    };

    const handleClearAll = async () => {
        try {
            await searchApi.clearSearchHistory();
            setHistory([]);
            setFilteredHistory([]);
            showSuccess('Search history cleared');
            onClose();
        } catch (error) {
            console.error('Failed to clear search history:', error);
            showError('Failed to clear search history');
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const highlightMatch = (text: string, query: string): React.ReactNode => {
        if (!query.trim()) return text;

        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);

        if (index === -1) return text;

        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);

        return (
            <>
                {before}
                <mark className="bg-pulse/20 text-primary font-medium">{match}</mark>
                {after}
            </>
        );
    };

    if (!isOpen) return null;

    // Don't show dropdown if still loading and no history yet
    if (loading && history.length === 0) {
        return null;
    }

    return (
        <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-base border border-subtle rounded-xl shadow-2xl overflow-hidden animate-slideDown"
            style={{
                top: inputRef.current
                    ? `${inputRef.current.getBoundingClientRect().height + 4}px`
                    : '100%'
            }}
        >
            <div className="max-h-[400px] overflow-y-auto">
                {filteredHistory.length === 0 && (
                    <div className="p-4 text-center text-muted">
                        <svg
                            className="w-8 h-8 mx-auto mb-2 text-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="text-sm">
                            {query.trim() ? 'No matching search history' : 'No search history'}
                        </p>
                    </div>
                )}

                {filteredHistory.length > 0 && (
                    <>
                        <div className="py-2">
                            {filteredHistory.map((item, index) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                        onSelect(item.searchQuery, item.filtersApplied || undefined)
                                    }
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full px-4 py-3 text-left hover:bg-surface-glass transition-colors flex items-center justify-between group ${
                                        selectedIndex === index ? 'bg-surface-glass' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <svg
                                            className="w-5 h-5 text-muted flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-primary font-medium truncate">
                                                {highlightMatch(item.searchQuery, query)}
                                            </div>
                                            <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                                                <span>{formatTimeAgo(item.searchDate)}</span>
                                                {item.resultsCount !== null && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            {item.resultsCount} result
                                                            {item.resultsCount !== 1 ? 's' : ''}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="ml-2 p-1 rounded hover:bg-surface-glass/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Delete search history item"
                                    >
                                        <svg
                                            className="w-4 h-4 text-muted hover:text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </button>
                            ))}
                        </div>

                        {history.length > 0 && (
                            <div className="border-t border-subtle">
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="w-full px-4 py-3 text-left text-sm text-muted hover:bg-surface-glass transition-colors flex items-center gap-2"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Clear all history
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default SearchHistoryDropdown;

