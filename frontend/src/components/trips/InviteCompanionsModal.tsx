import { useState, useEffect } from 'react';
import { X, UserPlus, Search, Loader2 } from 'lucide-react';
import { getBuddies } from '../../services/buddyService';
import type { Buddy } from '../../services/buddyService';
import { useSafeToast } from '../../hooks/useSafeToast';
import Avatar from '../ui/Avatar';

interface InviteCompanionsModalProps {
  tripId: number;
  existingCompanions: Array<{ user_id: number; username: string }>;
  onClose: () => void;
  onInvite: (userId: number) => Promise<void>;
}

export const InviteCompanionsModal: React.FC<InviteCompanionsModalProps> = ({
  existingCompanions,
  onClose,
  onInvite
}) => {
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [filteredBuddies, setFilteredBuddies] = useState<Buddy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<number | null>(null);
  const { showError, showSuccess } = useSafeToast();

  const loadBuddies = async () => {
    try {
      setLoading(true);
      const response = await getBuddies();
      if (response.success && response.data?.buddies) {
        // Filter out buddies who are already companions
        const existingIds = existingCompanions.map(c => c.user_id);
        const availableBuddies = response.data.buddies.filter(
          buddy => !existingIds.includes(buddy.id)
        );
        setBuddies(availableBuddies);
        setFilteredBuddies(availableBuddies);
      } else {
        // No buddies or empty response - this is fine, show empty state
        setBuddies([]);
        setFilteredBuddies([]);
      }
    } catch (error: any) {
      // Check if it's a 404 or empty response vs actual error
      const statusCode = error?.response?.status || error?.status;
      if (statusCode === 404 || statusCode === 200) {
        // No buddies exist or empty response - this is fine, just set empty array
        setBuddies([]);
        setFilteredBuddies([]);
      } else {
        // Only log actual errors, don't show error toast
        // Empty buddies state is handled gracefully by the UI
        console.error('Error loading buddies:', error);
        setBuddies([]);
        setFilteredBuddies([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuddies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = buddies.filter(
        buddy =>
          buddy.full_name.toLowerCase().includes(query) ||
          buddy.username.toLowerCase().includes(query)
      );
      setFilteredBuddies(filtered);
    } else {
      setFilteredBuddies(buddies);
    }
  }, [searchQuery, buddies]);

  const handleInvite = async (userId: number) => {
    try {
      setInviting(userId);
      await onInvite(userId);
      showSuccess('Invitation sent successfully!');
      
      // Remove invited buddy from list
      setBuddies(prev => prev.filter(b => b.id !== userId));
      setFilteredBuddies(prev => prev.filter(b => b.id !== userId));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInviting(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface-glass backdrop-blur-lg border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Invite Travel Buddies</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type="text"
            placeholder="Search buddies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-base border border-white/10 rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-pulse/50 focus:border-pulse transition-all"
          />
        </div>

        {/* Buddies List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-pulse animate-spin mb-3" />
              <p className="text-text-secondary">Loading buddies...</p>
            </div>
          ) : filteredBuddies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserPlus className="w-12 h-12 text-text-secondary mb-3" />
              <p className="text-text-secondary text-center">
                {searchQuery 
                  ? 'No buddies found matching your search' 
                  : buddies.length === 0 
                    ? 'All your buddies are already invited or you don\'t have any buddies yet'
                    : 'No buddies available to invite'}
              </p>
            </div>
          ) : (
            filteredBuddies.map((buddy) => (
              <div
                key={buddy.id}
                className="flex items-center gap-4 p-4 bg-base/50 border border-white/10 rounded-lg hover:bg-base/70 transition-colors"
              >
                {/* Profile Photo */}
                <Avatar
                  src={buddy.profile_photo_url}
                  name={buddy.full_name}
                  size="md"
                />

                {/* Buddy Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">{buddy.full_name}</h3>
                  <p className="text-sm text-text-secondary">@{buddy.username}</p>
                  {buddy.current_location && (
                    <p className="text-xs text-text-secondary mt-1">📍 {buddy.current_location}</p>
                  )}
                </div>

                {/* Invite Button */}
                <button
                  onClick={() => handleInvite(buddy.id)}
                  disabled={inviting === buddy.id}
                  className="px-4 py-2 bg-pulse hover:bg-pulse/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting === buddy.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Invite
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-text-primary font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
