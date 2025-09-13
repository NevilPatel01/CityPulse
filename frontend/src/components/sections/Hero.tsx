import React from 'react';
import { Button } from '../ui';

export const Hero: React.FC = () => {
  return (
    <section className='py-20 px-4 lg:py-32'>
      <div className='container mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>
          {/* Left Column - Text */}
          <div className='space-y-8'>
            <h1 className='text-4xl lg:text-6xl font-bold text-primary leading-tight'>
              Discover cities like a <span className='text-pulse'>local</span>
            </h1>
            <p className='text-muted text-lg lg:text-xl max-w-lg'>
              Get authentic recommendations from people who know the city best.
              Skip the tourist traps and experience the real culture.
            </p>
            <div className='flex flex-col sm:flex-row gap-4'>
              <Button
                size='lg'
                className='bg-pulse text-white hover:opacity-90 px-8 py-4 text-lg'
              >
                Join CityPulse
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-subtle text-primary hover:bg-white hover:bg-opacity-10 px-8 py-4 text-lg'
              >
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className='relative'>
            <img
              src='https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop&crop=center'
              alt='City street scene'
              className='w-full h-96 object-cover rounded-2xl shadow-glass'
            />

            {/* Floating elements */}
            <div className='absolute top-4 left-4 bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-xl px-3 py-2 flex items-center gap-2'>
              <div className='w-2 h-2 bg-pulse rounded-full'></div>
              <span className='text-primary text-sm font-medium'>
                Local insights
              </span>
            </div>
            <div className='absolute top-1/2 -right-4 bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-xl px-3 py-2 flex items-center gap-2'>
              <div className='w-2 h-2 bg-pulse rounded-full'></div>
              <span className='text-primary text-sm font-medium'>
                Real-time
              </span>
            </div>
            <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-xl px-3 py-2 flex items-center gap-2'>
              <div className='w-2 h-2 bg-pulse rounded-full'></div>
              <span className='text-primary text-sm font-medium'>
                Authentic
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
