import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface UserDropdownProps {
  className?: string;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user?.fullName) {
      return '?';
    }
    
    const nameParts = user.fullName.trim().split(' ').filter(part => part.length > 0);
    
    if (nameParts.length === 0) return '?';
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  if (!user) return null;

  const isActivePath = (path: string) => location.pathname === path;
  const isProfilePath = () => location.pathname.startsWith('/profile');

  return (
    <div className={`relative ml-auto ${className}`} ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-surface-glass transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2"
        aria-label={`User menu for ${user.fullName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Profile Picture or Initials */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-surface-glass bg-pulse">
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-bold">
              {getUserInitials()}
            </span>
          )}
        </div>
        
        {/* User Name (hidden on mobile) */}
        <span className="hidden md:block text-primary text-sm font-medium truncate max-w-24">
          {user.fullName ? user.fullName.split(' ')[0] : 'User'}
        </span>
        
        {/* Dropdown Arrow */}
        <svg 
          className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-base border border-subtle rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-subtle">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-pulse bg-pulse">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-bold">
                    {getUserInitials()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {user.fullName || 'Unknown User'}
                </p>
                <p className="text-xs text-muted truncate">
                  @{user.username || 'unknown'}
                </p>
                <p className="text-xs text-muted truncate">
                  {user.email || 'no-email@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to="/explore"
              className={`flex items-center px-4 py-2 text-sm transition-colors ${
                isActivePath('/explore') 
                  ? 'bg-pulse/10 text-pulse border-l-4 border-pulse' 
                  : 'text-primary hover:bg-surface-glass'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3 text-base">📊</span>
              Explore
              {isActivePath('/explore') && (
                <span className="ml-auto text-pulse" aria-hidden="true">●</span>
              )}
            </Link>
            
            <Link
              to={`/profile/${user.username}`}
              className={`flex items-center px-4 py-2 text-sm transition-colors ${
                isProfilePath() 
                  ? 'bg-pulse/10 text-pulse border-l-4 border-pulse' 
                  : 'text-primary hover:bg-surface-glass'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3 text-base">👤</span>
              My Profile
              {isProfilePath() && (
                <span className="ml-auto text-pulse" aria-hidden="true">●</span>
              )}
            </Link>
            
            <Link
              to="/leaderboard"
              className={`flex items-center px-4 py-2 text-sm transition-colors ${
                isActivePath('/leaderboard') 
                  ? 'bg-pulse/10 text-pulse border-l-4 border-pulse' 
                  : 'text-primary hover:bg-surface-glass'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3 text-base">🏆</span>
              Leaderboard
              {isActivePath('/leaderboard') && (
                <span className="ml-auto text-pulse" aria-hidden="true">●</span>
              )}
            </Link>
            
            <Link
              to="/settings"
              className={`flex items-center px-4 py-2 text-sm transition-colors ${
                isActivePath('/settings') 
                  ? 'bg-pulse/10 text-pulse border-l-4 border-pulse' 
                  : 'text-primary hover:bg-surface-glass'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <span className="mr-3 text-base">⚙️</span>
              Settings
              {isActivePath('/settings') && (
                <span className="ml-auto text-pulse" aria-hidden="true">●</span>
              )}
            </Link>

            {/* Moderator Dashboard Link - Only visible to moderators */}
            {user.role === 'moderator' && (
              <Link
                to="/moderator/dashboard"
                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                  isActivePath('/moderator/dashboard') 
                    ? 'bg-purple-100 text-purple-800 border-l-4 border-purple-600' 
                    : 'text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-3 text-base">🛡️</span>
                Moderator Dashboard
                {isActivePath('/moderator/dashboard') && (
                  <span className="ml-auto text-purple-600" aria-hidden="true">●</span>
                )}
              </Link>
            )}

            <div className="border-t border-subtle my-1"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-surface-glass transition-colors"
            >
              <span className="mr-3 text-base">🚪</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
