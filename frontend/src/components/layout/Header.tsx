import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navigationItems = [
    { path: '/features', label: 'Features', icon: '✨' },
    { path: '/about', label: 'About', icon: '📖' },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-pulse focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className='sticky top-0 z-40 border-b border-subtle backdrop-blur-glass bg-surface-glass/95 supports-[backdrop-filter]:bg-surface-glass/80'>
        <div className='container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between'>
          {/* Logo */}
          <Link 
            to="/" 
            className='flex items-center gap-2 hover:opacity-80 transition-all duration-200 active:scale-95'
            aria-label="CityPulse Home"
          >
            <div className='w-8 h-8 rounded-full bg-pulse flex items-center justify-center hover:shadow-lg hover:shadow-pulse/30 transition-shadow duration-200'>
              <span className='text-white font-bold text-sm'>CP</span>
            </div>
            <span className='font-bold text-xl text-primary'>CityPulse</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex items-center gap-8' role="navigation" aria-label="Main navigation">
            {navigationItems.map(({ path, label, icon }) => (
              <Link
                key={path}
                to={path}
                className={`text-primary hover:text-pulse transition-all duration-200 hover:scale-105 active:scale-95 relative after:content-[""] after:absolute after:w-0 after:h-0.5 after:bg-pulse after:left-0 after:-bottom-1 after:transition-all after:duration-200 hover:after:w-full ${
                  isActivePath(path) ? 'text-pulse after:w-full' : ''
                }`}
                aria-current={isActivePath(path) ? 'page' : undefined}
              >
                <span className="mr-1" aria-hidden="true">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className='flex items-center gap-3'>
            {/* Login Button - Always visible */}
            <Link to="/login">
              <Button
                variant='ghost'
                size="sm"
                className='text-primary hover:bg-surface-glass hover:text-pulse transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] px-3'
                aria-label="Login to your account"
              >
                <span className="mr-1 text-sm" aria-hidden="true">🔒</span>
                <span className="text-sm">Login</span>
              </Button>
            </Link>

            {/* Sign Up Button - Hidden on mobile to save space */}
            <Link to="/signup" className="hidden md:block">
              <Button 
                size="sm"
                className='bg-pulse text-pulse-fg hover:opacity-90 hover:shadow-lg hover:shadow-pulse/25 transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] px-4'
                aria-label="Create new account"
              >
                <span className="text-sm">Sign Up</span>
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className='mobile-menu-button lg:hidden p-3 rounded-md hover:bg-surface-glass transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`block h-0.5 w-5 bg-primary transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
                }`} />
                <span className={`block h-0.5 w-5 bg-primary transition-all duration-300 mt-1 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`} />
                <span className={`block h-0.5 w-5 bg-primary transition-all duration-300 mt-1 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
                }`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <nav
        id="mobile-menu"
        className={`mobile-menu fixed top-0 right-0 h-full w-80 max-w-[85vw] z-40 bg-surface border-l border-subtle transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-subtle">
            <h2 className="text-lg font-semibold text-primary">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md hover:bg-surface-glass transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pulse focus:ring-offset-2"
              aria-label="Close menu"
            >
              <span className="block w-6 h-6 relative">
                <span className="block absolute top-1/2 left-1/2 w-4 h-0.5 bg-primary rotate-45 transform -translate-x-1/2 -translate-y-1/2" />
                <span className="block absolute top-1/2 left-1/2 w-4 h-0.5 bg-primary -rotate-45 transform -translate-x-1/2 -translate-y-1/2" />
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map(({ path, label, icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center w-full px-4 py-3 text-left rounded-md transition-all duration-200 hover:bg-surface-glass hover:scale-105 active:scale-95 ${
                  isActivePath(path) 
                    ? 'bg-pulse/10 text-pulse border-l-4 border-pulse' 
                    : 'text-primary hover:text-pulse'
                }`}
                aria-current={isActivePath(path) ? 'page' : undefined}
              >
                <span className="mr-3 text-lg" aria-hidden="true">{icon}</span>
                <span className="font-medium">{label}</span>
                {isActivePath(path) && (
                  <span className="ml-auto text-pulse" aria-hidden="true">●</span>
                )}
              </Link>
            ))}

            {/* Mobile-only Sign Up Button */}
            <div className="pt-4 mt-4 border-t border-subtle md:hidden">
              <Link
                to="/signup"
                className="flex items-center w-full px-4 py-3 text-left rounded-md bg-pulse text-pulse-fg hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span className="mr-3 text-lg" aria-hidden="true">✨</span>
                <span className="font-medium">Sign Up</span>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-subtle">
            <div className="flex items-center justify-center text-sm text-muted">
              <span className="mr-1" aria-hidden="true">📱</span>
              Mobile Menu
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
