import React from 'react';
import { Card, CardContent } from '../ui';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: '📍',
      title: 'Local Expertise',
      description:
        'Recommendations from verified locals who know their cities inside out.',
    },
    {
      icon: '👥',
      title: 'Travel Buddies',
      description:
        'Connect with like-minded travelers and locals for authentic experiences.',
    },
    {
      icon: '🌟',
      title: 'Verified Reviews',
      description: 'Authentic reviews from real people, not tourists or bots.',
    },
    {
      icon: '🗺️',
      title: 'Hidden Gems',
      description: "Discover places that aren't in guidebooks but locals love.",
    },
    {
      icon: '🕒',
      title: 'Real-Time Updates',
      description: 'Get live information about wait times, crowds, and events.',
    },
    {
      icon: '🔒',
      title: 'Safe & Secure',
      description:
        'All recommendations are verified for safety and authenticity.',
    },
  ];

  return (
    <section className='py-20 px-4 bg-gradient-to-b from-transparent to-surface-glass/20'>
      <div className='container mx-auto'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
            Why choose CityPulse?
          </h2>
          <p className='text-muted text-lg max-w-2xl mx-auto'>
            Experience travel like never before with authentic local insights
            and connections
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <Card
              key={index}
              className='hover:shadow-lg transition-shadow duration-300'
            >
              <CardContent>
                <div className='text-4xl mb-4'>{feature.icon}</div>
                <h3 className='text-xl font-semibold text-primary mb-3'>
                  {feature.title}
                </h3>
                <p className='text-muted'>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
