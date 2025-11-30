import React, { useEffect, useState } from 'react';
import { searchApi, type SearchHistoryItem } from '../../services/searchService';
import { useToast } from '../../hooks/useToast';

interface SearchHistorySidebarProps {
    onSelectSearch: (query: string, filters?: Record<string, unknown>) => void;
    isOpen: boolean;
    onClose: () => void;
}

interface GroupedHistory {
    label: string;
    items: SearchHistoryItem[];
}

const SearchHistorySidebar: React.FC<SearchHistorySidebarProps> = ({
    onSelectSearch,
    isOpen,
    onClose
}) => {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (history.length > 0) {
            setGroupedHistory(groupHistoryByDate(history));
        } else {
            setGroupedHistory([]);
        }
    }, [history]);

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

    const groupHistoryByDate = (items: SearchHistoryItem[]): GroupedHistory[] => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        const groups: { [key: string]: SearchHistoryItem[] } = {
            Today: [],
            Yesterday: [],
            'This Week': [],
            Older: []
        };

        items.forEach(item => {
            const itemDate = new Date(item.searchDate);
            
            if (itemDate >= today) {
                groups.Today.push(item);
            } else if (itemDate >= yesterday) {
                groups.Yesterday.push(item);
            } else if (itemDate >= thisWeek) {
                groups['This Week'].push(item);
            } else {
                groups.Older.push(item);
            }
        });

        return Object.entries(groups)
            .filter(([, items]) => items.length > 0)
            .map(([label, items]) => ({ label, items }));
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
            setGroupedHistory([]);
            showSuccess('Search history cleared');
        } catch (error) {
            console.error('Failed to clear search history:', error);
            showError('Failed to clear search history');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className="fixed top-0 right-0 bottom-0 w-[90%] max-w-md bg-base border-l border-subtle z-50 transform transition-transform duration-300 overflow-hidden flex flex-col lg:relative lg:w-80 lg:max-w-none lg:border-l lg:border-r lg:border-t-0 lg:translate-x-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-subtle bg-surface-glass">
                    <h2 className="text-xl font-bold text-primary">Search History</h2>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="px-3 py-1.5 text-sm text-muted hover:text-primary transition-colors"
                                title="Clear all history"
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-surface-glass transition-colors lg:hidden"
                            aria-label="Close sidebar"
                        >
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {groupedHistory.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <svg
                                className="w-16 h-16 mx-auto mb-4 text-muted"
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
                            <h3 className="text-lg font-semibold text-primary mb-2">No Search History</h3>
                            <p className="text-sm text-muted max-w-xs">
                                Your recent searches will appear here for quick access
                            </p>
                        </div>
                    )}

                    {groupedHistory.length > 0 && (
                        <div className="p-4 space-y-6">
                            {groupedHistory.map((group) => (
                                <div key={group.label}>
                                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                                        {group.label}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.items.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    onSelectSearch(item.searchQuery, item.filtersApplied || undefined)
                                                }
                                                className="w-full px-4 py-3 text-left hover:bg-surface-glass rounded-lg transition-colors group"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-primary font-medium truncate">
                                                            {item.searchQuery}
                                                        </div>
                                                        <div className="text-xs text-muted flex items-center gap-2 mt-1">
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
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(e, item.id)}
                                                        className="ml-2 p-1.5 rounded hover:bg-surface-glass/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default SearchHistorySidebar;

