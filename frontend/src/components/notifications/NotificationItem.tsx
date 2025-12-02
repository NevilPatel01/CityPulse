import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../services/notificationService';
import { apiConfig } from '../../config/api';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'buddy_request':
        return (
          <div className="w-10 h-10 rounded-full bg-pulse/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        );
      case 'buddy_accepted':
        return (
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'recommendation_like':
        return (
          <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case 'recommendation_rating':
        return (
          <div className="w-10 h-10 rounded-full bg-accent-amber/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-accent-amber" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        );
      case 'achievement_unlocked':
        return (
          <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-surface-glass flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      // Redirect buddy notifications to requests tab
      if (notification.notification_type === 'buddy_request' || notification.notification_type === 'buddy_accepted') {
        navigate('/travel-buddies?tab=requests');
      } else {
        navigate(notification.action_url);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 cursor-pointer transition-all duration-200 hover:bg-surface-glass/50 active:scale-[0.99] ${
        !notification.is_read ? 'bg-pulse/5 border-l-3 border-pulse' : ''
      }`}
    >
      {notification.related_user_photo && !imageError ? (
        <img
          src={notification.related_user_photo.startsWith('http') ? notification.related_user_photo : `${apiConfig.baseUrl}${notification.related_user_photo.startsWith('/') ? notification.related_user_photo : `/${notification.related_user_photo}`}`}
          alt={notification.related_user_name || ''}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={() => setImageError(true)}
        />
      ) : (
        getNotificationIcon(notification.notification_type)
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-primary font-medium mb-1">{notification.title}</p>
        <p className="text-sm text-muted line-clamp-2">{notification.message}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted">{getRelativeTime(notification.created_at)}</span>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-pulse"></span>
          )}
        </div>
      </div>
    </div>
  );
};
