import React, { useEffect, useState } from 'react';
import { searchApi, type SearchHistoryItem } from '../../services/searchService';
import { useToast } from '../../hooks/useToast';

interface SearchHistoryListProps {
    onSelectSearch: (query: string, filters?: Record<string, unknown>) => void;
}

const SearchHistoryList: React.FC<SearchHistoryListProps> = ({
    onSelectSearch
}) => {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const response = await searchApi.getSearchHistory(100, 0);
            setHistory(response.history);
        } catch (error) {
            console.error('Failed to load search history:', error);
            showError('Failed to load search history');
        } finally {
            setLoading(false);
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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
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
            showSuccess('Search history cleared');
        } catch (error) {
            console.error('Failed to clear search history:', error);
            showError('Failed to clear search history');
        }
    };

    const handleItemClick = (item: SearchHistoryItem) => {
        onSelectSearch(item.searchQuery, item.filtersApplied || undefined);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse mb-4"></div>
                <p className="text-muted">Loading search history...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg
                    className="w-20 h-20 mx-auto mb-4 text-muted"
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
                <h3 className="text-xl font-semibold text-primary mb-2">No Search History</h3>
                <p className="text-sm text-muted max-w-md">
                    Your recent searches will appear here for quick access
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-subtle">
                <h2 className="text-2xl font-bold text-primary">Search History</h2>
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 hover:bg-surface-glass rounded-lg"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                    Clear All
                </button>
            </div>

            {/* History List */}
            <div className="space-y-2">
                {history.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="group p-4 bg-surface-glass border border-subtle rounded-xl hover:border-pulse hover:shadow-lg transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <svg
                                        className="w-5 h-5 text-pulse flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-primary truncate">
                                        {item.searchQuery}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted ml-8">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        {formatTimeAgo(item.searchDate)}
                                    </span>
                                    {item.resultsCount !== null && (
                                        <>
                                            <span>•</span>
                                            <span>
                                                {item.resultsCount} result{item.resultsCount !== 1 ? 's' : ''}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, item.id)}
                                className="ml-2 p-2 rounded-lg hover:bg-surface-glass/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                aria-label="Delete search history item"
                            >
                                <svg
                                    className="w-5 h-5 text-muted hover:text-primary"
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
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchHistoryList;

