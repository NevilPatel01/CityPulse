import { useState, useCallback } from 'react';
import { searchApi, type SearchHistoryItem } from '../services/searchService';
import { useToast } from './useToast';

interface UseSearchHistoryReturn {
    history: SearchHistoryItem[];
    loading: boolean;
    error: string | null;
    loadHistory: (limit?: number, offset?: number) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
    clearAll: () => Promise<void>;
    refresh: () => Promise<void>;
}

/**
 * Custom hook for managing search history
 * Provides state management and API methods for search history operations
 */
export const useSearchHistory = (): UseSearchHistoryReturn => {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();

    const loadHistory = useCallback(async (limit: number = 100, offset: number = 0) => {
        setLoading(true);
        setError(null);
        try {
            const response = await searchApi.getSearchHistory(limit, offset);
            setHistory(response.history);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load search history';
            setError(errorMessage);
            console.error('Failed to load search history:', err);
            // Don't show toast for initial load failures
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteItem = useCallback(async (id: number) => {
        try {
            await searchApi.deleteSearchHistoryItem(id);
            setHistory(prev => prev.filter(item => item.id !== id));
            showSuccess('Search history item deleted');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete search history item';
            setError(errorMessage);
            showError(errorMessage);
            throw err;
        }
    }, [showSuccess, showError]);

    const clearAll = useCallback(async () => {
        try {
            await searchApi.clearSearchHistory();
            setHistory([]);
            showSuccess('Search history cleared');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to clear search history';
            setError(errorMessage);
            showError(errorMessage);
            throw err;
        }
    }, [showSuccess, showError]);

    const refresh = useCallback(async () => {
        await loadHistory();
    }, [loadHistory]);

    return {
        history,
        loading,
        error,
        loadHistory,
        deleteItem,
        clearAll,
        refresh
    };
};

