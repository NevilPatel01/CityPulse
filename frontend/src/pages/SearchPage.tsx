import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useSearchOverlay } from '../context/SearchOverlayContext';

/**
 * SearchPage - Redirects to explore and opens search modal
 * The search functionality is now handled entirely through the GlobalSearchOverlay modal
 */
export default function SearchPage() {
  useAuthGuard({ requireAuth: true });
  const navigate = useNavigate();
  const { openSearch } = useSearchOverlay();

  useEffect(() => {
    // Open the search modal and redirect to explore
    openSearch();
    navigate('/explore', { replace: true });
  }, [openSearch, navigate]);

  // Return null since we're redirecting
  return null;
}
