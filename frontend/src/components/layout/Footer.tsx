import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className='bg-surface-glass border-t border-subtle py-12 px-4'>
      <div className='container mx-auto'>
        <div className='text-center mb-8'>
          {/* Brand */}
          <div className='flex items-center gap-2 mb-4 justify-center'>
            <div className='w-8 h-8 rounded-full bg-pulse flex items-center justify-center hover:shadow-lg hover:shadow-pulse/30 transition-all duration-200 hover:scale-110'>
              <span className='text-white font-bold text-sm'>CP</span>
            </div>
            <span className='font-bold text-xl text-primary'>CityPulse</span>
          </div>
          <p className='text-muted text-sm max-w-md mx-auto'>
            Discover authentic local experiences in every city around the world.
          </p>
        </div>

        <div className='border-t border-subtle pt-8 text-center'>
          <p className='text-muted text-sm hover:text-pulse transition-colors duration-200'>
            © 2025 CityPulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
