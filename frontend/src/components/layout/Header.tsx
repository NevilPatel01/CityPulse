import React from 'react';
import { Button } from '../ui';

export const Header: React.FC = () => {
  return (
    <header className='border-b border-subtle backdrop-blur-glass bg-surface-glass'>
      <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-full bg-pulse flex items-center justify-center'>
            <span className='text-white font-bold text-sm'>CP</span>
          </div>
          <span className='font-bold text-xl text-primary'>CityPulse</span>
        </div>

        {/* Desktop Navigation */}
        <nav className='hidden lg:flex items-center gap-8'>
          <a
            href='#features'
            className='text-muted hover:text-primary transition-colors'
          >
            Features
          </a>
          <a
            href='#about'
            className='text-muted hover:text-primary transition-colors'
          >
            About
          </a>
        </nav>

        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            className='text-primary hover:bg-surface-glass'
          >
            🔒 Login
          </Button>
          <Button className='hidden lg:inline-flex bg-pulse text-white hover:opacity-90'>
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};
