import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();

  const handleJoinCityPulse = () => {
    navigate('/signup');
  };

  return (
    <section className='py-20 px-4'>
      <div className='container mx-auto text-center'>
        <div className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass rounded-2xl p-8 lg:p-12 max-w-4xl mx-auto'>
          <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
            Ready to explore like a local?
          </h2>
          <p className='text-muted text-lg mb-8 max-w-2xl mx-auto'>
            Join thousands of travelers discovering authentic experiences in
            every city.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              size='lg'
              className='bg-pulse text-white hover:opacity-90 px-8 py-4 text-lg'
              onClick={handleJoinCityPulse}
            >
              Join CityPulse Today
            </Button>
          </div>          
        </div>
      </div>
    </section>
  );
};
