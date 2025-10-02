import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui';
import { useSafeToast } from '../../hooks/useSafeToast';

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { showInfo } = useSafeToast();

  const handleJoinCityPulse = () => {
    navigate('/signup');
  };

  const handleWatchDemo = () => {
    showInfo('Coming Soon', 'Video will be added soon!', 3000);
  };

  return (
    <section 
      className='py-20 px-4 lg:py-32'
      aria-labelledby="hero-heading"
    >
      <div className='container mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>
          {/* Left Column - Text */}
          <div className='space-y-8'>
            <h1 
              id="hero-heading"
              className='text-4xl lg:text-6xl font-bold text-primary leading-tight'
            >
              Discover cities like a <span className='text-pulse'>local</span>
            </h1>
            <p className='text-muted text-lg lg:text-xl max-w-lg'>
              Get authentic recommendations from people who know the city best.
              Skip the tourist traps and experience the real culture.
            </p>
            <div className='flex flex-col sm:flex-row gap-4' role="group" aria-label="Get started actions">
              <Button
                size='lg'
                className='bg-pulse text-white hover:opacity-90 px-8 py-4 text-lg'
                ariaLabel="Join CityPulse to start discovering cities like a local"
                onClick={handleJoinCityPulse}
              >
                Join CityPulse
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-subtle text-primary hover:bg-white hover:bg-opacity-10 px-8 py-4 text-lg'
                ariaLabel="Watch demo video showing how CityPulse works"
                onClick={handleWatchDemo}
              >
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className='relative'>
            <img
              src='https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop&crop=center'
              alt='Vibrant city street scene with people walking and exploring local shops and cafes, representing authentic local travel experiences'
              className='w-full h-96 object-cover rounded-2xl shadow-glass'
              loading="eager"
              decoding="async"
            />

            {/* Floating elements */}
            <div 
              className='absolute top-4 left-4 bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-xl px-3 py-2 flex items-center gap-2'
              role="img"
              aria-label="Local insights indicator"
            >
              <div 
                className='w-2 h-2 bg-pulse rounded-full'
                aria-hidden="true"
              ></div>
              <span className='text-primary text-sm font-medium'>
                Local insights
              </span>
            </div>
            <div 
              className='absolute top-1/2 -right-4 bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-xl px-3 py-2 flex items-center gap-2'
              role="img"
              aria-label="Real-time updates indicator"
            >
              <div 
                className='w-2 h-2 bg-pulse rounded-full'
                aria-hidden="true"
              ></div>
              <span className='text-primary text-sm font-medium'>
                Real-time
              </span>
            </div>
            <div 
              className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-xl px-3 py-2 flex items-center gap-2'
              role="img"
              aria-label="Authentic experiences indicator"
            >
              <div 
                className='w-2 h-2 bg-pulse rounded-full'
                aria-hidden="true"
              ></div>
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
