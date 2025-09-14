import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui';

export const Header: React.FC = () => {
  return (
    <header className='border-b border-subtle backdrop-blur-glass bg-surface-glass'>
      <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <Link to="/" className='flex items-center gap-2 hover:opacity-80 transition-all duration-200 active:scale-95'>
          <div className='w-8 h-8 rounded-full bg-pulse flex items-center justify-center hover:shadow-lg hover:shadow-pulse/30 transition-shadow duration-200'>
            <span className='text-white font-bold text-sm'>CP</span>
          </div>
          <span className='font-bold text-xl text-primary'>CityPulse</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden lg:flex items-center gap-8'>
          <Link
            to='/features'
            className='text-primary hover:text-pulse transition-all duration-200 hover:scale-105 active:scale-95 relative after:content-[""] after:absolute after:w-0 after:h-0.5 after:bg-pulse after:left-0 after:-bottom-1 after:transition-all after:duration-200 hover:after:w-full'
          >
            Features
          </Link>
          <Link
            to='/about'
            className='text-primary hover:text-pulse transition-all duration-200 hover:scale-105 active:scale-95 relative after:content-[""] after:absolute after:w-0 after:h-0.5 after:bg-pulse after:left-0 after:-bottom-1 after:transition-all after:duration-200 hover:after:w-full'
          >
            About
          </Link>
        </nav>

        <div className='flex items-center gap-3'>
          <Link to="/login">
            <Button
              variant='ghost'
              className='text-primary hover:bg-surface-glass hover:text-pulse transition-all duration-200 hover:scale-105 active:scale-95'
            >
              🔒 Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button className='hidden lg:inline-flex bg-pulse text-pulse-fg hover:opacity-90 hover:shadow-lg hover:shadow-pulse/25 transition-all duration-200 hover:scale-105 active:scale-95'>
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
