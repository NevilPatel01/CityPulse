import { useEffect, useRef, useState } from 'react';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';
import { deleteNotification, deleteAllRead } from '../../services/notificationService';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, isLoading, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, refresh } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      // Fetch notifications in background
      fetchNotifications(true); // Silent fetching
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearAllRead = async () => {
    try {
      await deleteAllRead();
      refresh();
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await deleteNotification(notificationId);
      refresh();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-base border-2 border-subtle rounded-xl shadow-glass overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-subtle">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-primary">Notifications</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-1 rounded hover:bg-surface-glass"
            aria-label="Close notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-pulse text-white'
                : 'text-muted hover:text-primary hover:bg-surface-glass'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'unread'
                ? 'bg-pulse text-white'
                : 'text-muted hover:text-primary hover:bg-surface-glass'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-b border-subtle flex gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="text-xs text-pulse hover:text-accent-amber transition-colors font-medium"
          >
            Mark all as read
          </button>
          <span className="text-pulse">•</span>
          <button
            onClick={handleClearAllRead}
            className="text-xs text-pulse hover:text-accent-amber transition-colors font-medium"
          >
            Clear read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-surface-glass flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-muted text-center">
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="relative group">
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markNotificationAsRead}
                />
                <button
                  onClick={(e) => handleDeleteNotification(notification.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-glass text-muted hover:text-error"
                  aria-label="Delete notification"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
