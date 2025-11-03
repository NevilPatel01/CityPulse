import { useState } from 'react';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface-glass focus:outline-none focus:ring-2 focus:ring-pulse"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-error text-white text-xs font-semibold rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1.5 shadow-lg animate-in fade-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};
