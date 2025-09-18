import React from 'react';
import { Card, CardContent, CardTitle, CardDescription } from '../ui';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: '📍',
      iconLabel: 'Location pin icon',
      title: 'Local Expertise',
      description:
        'Recommendations from verified locals who know their cities inside out.',
    },
    {
      icon: '👥',
      iconLabel: 'People icon',
      title: 'Travel Buddies',
      description:
        'Connect with like-minded travelers and locals for authentic experiences.',
    },
    {
      icon: '🌟',
      iconLabel: 'Star icon',
      title: 'Verified Reviews',
      description: 'Authentic reviews from real people, not tourists or bots.',
    },
    {
      icon: '🗺️',
      iconLabel: 'Map icon',
      title: 'Hidden Gems',
      description: "Discover places that aren't in guidebooks but locals love.",
    },
    {
      icon: '🕒',
      iconLabel: 'Clock icon',
      title: 'Real-Time Updates',
      description: 'Get live information about wait times, crowds, and events.',
    },
    {
      icon: '🔒',
      iconLabel: 'Lock icon',
      title: 'Safe & Secure',
      description:
        'All recommendations are verified for safety and authenticity.',
    },
  ];

  return (
    <section 
      className='py-20 px-4 bg-gradient-to-b from-transparent to-surface-glass/20'
      aria-labelledby="features-heading"
    >
      <div className='container mx-auto'>
        <header className='text-center mb-16'>
          <h2 
            id="features-heading"
            className='text-3xl lg:text-4xl font-bold text-primary mb-6'
          >
            Why choose CityPulse?
          </h2>
          <p className='text-muted text-lg max-w-2xl mx-auto'>
            Experience travel like never before with authentic local insights
            and connections
          </p>
        </header>

        <div 
          className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'
          role="list"
          aria-label="CityPulse features"
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              className='hover:shadow-lg transition-shadow duration-300'
              as="article"
              role="listitem"
              ariaLabelledBy={`feature-title-${index}`}
              ariaDescribedBy={`feature-description-${index}`}
            >
              <CardContent>
                <div 
                  className='text-4xl mb-4'
                  role="img"
                  aria-label={feature.iconLabel}
                >
                  {feature.icon}
                </div>
                <CardTitle 
                  id={`feature-title-${index}`}
                  as="h3"
                  className="mb-3"
                >
                  {feature.title}
                </CardTitle>
                <CardDescription id={`feature-description-${index}`}>
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
