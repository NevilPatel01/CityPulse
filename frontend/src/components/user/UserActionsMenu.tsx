import React, { useState } from 'react';
import { MoreVertical, Flag, Ban, UserX } from 'lucide-react';
import { blockUser } from '../../services/buddyService';
import { useToast } from '../../hooks/useToast';
import { ReportUserModal } from './ReportUserModal';

interface UserActionsMenuProps {
  userId: number;
  username: string;
  isBlocked?: boolean;
  onBlock?: () => void;
  className?: string;
}

export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  userId,
  username,
  isBlocked = false,
  onBlock,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleBlock = async () => {
    if (isBlocking) return;

    const confirmed = window.confirm(
      `Are you sure you want to block @${username}? You won't see their content and they won't be able to interact with you.`
    );

    if (!confirmed) return;

    setIsBlocking(true);
    try {
      await blockUser(userId);
      showSuccess('User Blocked', `You have blocked @${username}`);
      setIsOpen(false);
      onBlock?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to block user';
      showError('Error', errorMessage);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReport = () => {
    setIsOpen(false);
    setShowReportModal(true);
  };

  if (isBlocked) {
    return null; // Don't show menu for blocked users
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="User actions menu"
          aria-expanded={isOpen}
        >
          <MoreVertical className="w-5 h-5 text-muted" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 mt-2 w-56 bg-surface-glass backdrop-blur-glass border border-subtle rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={handleReport}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors text-primary"
              >
                <Flag className="w-4 h-4" />
                <span className="text-sm">Report User</span>
              </button>

              <button
                onClick={handleBlock}
                disabled={isBlocking}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors text-error disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBlocking ? (
                  <>
                    <UserX className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Blocking...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span className="text-sm">Block User</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <ReportUserModal
        isOpen={showReportModal}
        targetUserId={userId}
        targetUsername={username}
        onClose={() => setShowReportModal(false)}
      />
    </>
  );
};
