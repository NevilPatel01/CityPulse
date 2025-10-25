import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SearchOverlayContextType {
    isOpen: boolean;
    openSearch: () => void;
    closeSearch: () => void;
    toggleSearch: () => void;
}

const SearchOverlayContext = createContext<SearchOverlayContextType | undefined>(undefined);

export const SearchOverlayProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openSearch = () => setIsOpen(true);
    const closeSearch = () => setIsOpen(false);
    const toggleSearch = () => setIsOpen(prev => !prev);

    return (
        <SearchOverlayContext.Provider value={{ isOpen, openSearch, closeSearch, toggleSearch }}>
            {children}
        </SearchOverlayContext.Provider>
    );
};

export const useSearchOverlay = () => {
    const context = useContext(SearchOverlayContext);
    if (!context) {
        throw new Error('useSearchOverlay must be used within SearchOverlayProvider');
    }
    return context;
};
