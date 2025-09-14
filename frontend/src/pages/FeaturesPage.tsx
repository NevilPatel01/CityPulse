import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent } from '../components/ui/card';

const FeaturesPage = () => {
  const mainFeatures = [
    {
      icon: '📍',
      title: 'Local Expertise',
      description:
        'Connect with verified locals who share insider knowledge about their cities.',
      details: [
        'Verified local profiles with city expertise ratings',
        'Authentic recommendations from people who live there',
        'Direct messaging with locals for personalized advice',
        'Local events and hidden gem discoveries',
      ],
    },
    {
      icon: '👥',
      title: 'Travel Buddy Matching',
      description:
        'Find like-minded travelers and locals to explore destinations together.',
      details: [
        'Smart matching based on interests and travel style',
        'Group formation for activities and events',
        'Safety-verified meetup coordination',
        'Shared experience planning and booking',
      ],
    },
    {
      icon: '🌟',
      title: 'Verified Reviews',
      description:
        'Trust authentic reviews from real people, not fake accounts or bots.',
      details: [
        'Identity verification for all reviewers',
        'Photo and location verification for reviews',
        'Community moderation and quality control',
        'Detailed rating system for different aspects',
      ],
    },
    {
      icon: '🗺️',
      title: 'Hidden Gems Discovery',
      description:
        "Uncover places that aren't in guidebooks but locals absolutely love.",
      details: [
        'Crowdsourced local favorite spots',
        'Off-the-beaten-path recommendations',
        'Seasonal and time-sensitive suggestions',
        'Local business support and promotion',
      ],
    },
    {
      icon: '🕒',
      title: 'Real-Time Updates',
      description:
        'Get live information about wait times, crowds, events, and local conditions.',
      details: [
        'Live crowd levels and wait times',
        'Weather-based activity suggestions',
        'Event notifications and last-minute opportunities',
        'Local transport and accessibility updates',
      ],
    },
    {
      icon: '🔒',
      title: 'Safety & Privacy',
      description:
        'All interactions are verified, secure, and designed with user safety in mind.',
      details: [
        'Identity verification for all users',
        'Secure messaging with privacy controls',
        'Location sharing with safety features',
        '24/7 support and emergency assistance',
      ],
    },
  ];

  const additionalFeatures = [
    {
      title: 'Smart Itinerary Builder',
      description:
        'AI-powered trip planning that adapts to your preferences and local insights.',
    },
    {
      title: 'Cultural Exchange Hub',
      description:
        'Language exchange, cultural learning, and meaningful connection opportunities.',
    },
    {
      title: 'Local Business Support',
      description:
        'Discover and support small, local businesses that make each city unique.',
    },
    {
      title: 'Sustainable Travel Tools',
      description:
        'Choose eco-friendly options and contribute positively to local communities.',
    },
    {
      title: 'Offline Access',
      description:
        'Download recommendations and maps for offline use while traveling.',
    },
    {
      title: 'Multi-Language Support',
      description:
        'Connect with locals and travelers worldwide in your preferred language.',
    },
  ];

  return (
    <div className='min-h-screen bg-base text-primary'>
      <Header />

      <main>
        {/* Hero Section */}
        <section className='py-20 lg:py-32 px-4'>
          <div className='container mx-auto text-center'>
            <h1 className='text-4xl lg:text-6xl font-bold text-primary mb-6 leading-tight'>
              Features that <span className='text-pulse'>transform</span> travel
            </h1>
            <p className='text-xl text-muted mb-8 leading-relaxed max-w-4xl mx-auto'>
              Discover how CityPulse's innovative features connect you with
              authentic local experiences, genuine travel companions, and
              insider knowledge that no guidebook can provide.
            </p>
          </div>
        </section>

        {/* Main Features */}
        <section className='py-20 px-4'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Core Features
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                Everything you need to experience cities like a local
              </p>
            </div>

            <div className='grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto'>
              {mainFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass hover:shadow-lg transition-all duration-300'
                >
                  <CardContent className='p-8'>
                    <div className='flex items-start gap-4 mb-6'>
                      <div className='text-4xl'>{feature.icon}</div>
                      <div>
                        <h3 className='text-2xl font-semibold text-primary mb-2'>
                          {feature.title}
                        </h3>
                        <p className='text-muted text-lg leading-relaxed'>
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      {feature.details.map((detail, detailIndex) => (
                        <div
                          key={detailIndex}
                          className='flex items-start gap-3'
                        >
                          <div className='w-2 h-2 bg-pulse rounded-full mt-2 flex-shrink-0'></div>
                          <p className='text-muted'>{detail}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className='py-20 px-4 bg-gradient-to-b from-transparent to-surface-glass/20'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                And Much More
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                Additional features designed to enhance every aspect of your
                travel experience
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
              {additionalFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass hover:shadow-lg transition-shadow duration-300'
                >
                  <CardContent className='p-6'>
                    <h3 className='text-lg font-semibold text-primary mb-3'>
                      {feature.title}
                    </h3>
                    <p className='text-muted leading-relaxed'>
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className='py-20 px-4'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                How CityPulse Works
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                Simple steps to unlock authentic travel experiences
              </p>
            </div>

            <div className='grid lg:grid-cols-4 gap-8 max-w-6xl mx-auto'>
              {[
                {
                  step: '1',
                  title: 'Create Your Profile',
                  description:
                    'Tell us about your travel style, interests, and the type of experiences you seek.',
                },
                {
                  step: '2',
                  title: 'Connect with Locals',
                  description:
                    'Browse verified local profiles and connect with people who share your interests.',
                },
                {
                  step: '3',
                  title: 'Get Recommendations',
                  description:
                    'Receive personalized suggestions for restaurants, activities, and hidden gems.',
                },
                {
                  step: '4',
                  title: 'Explore & Share',
                  description:
                    'Experience the city authentically and share your discoveries with the community.',
                },
              ].map((step, index) => (
                <Card
                  key={index}
                  className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass text-center'
                >
                  <CardContent className='p-6'>
                    <div className='w-12 h-12 rounded-full bg-pulse text-pulse-fg flex items-center justify-center mx-auto mb-4 text-xl font-bold'>
                      {step.step}
                    </div>
                    <h3 className='text-lg font-semibold text-primary mb-3'>
                      {step.title}
                    </h3>
                    <p className='text-muted leading-relaxed'>
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className='py-20 px-4'>
          <div className='container mx-auto text-center'>
            <Card className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass p-8 lg:p-12 max-w-4xl mx-auto'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Ready to explore like never before?
              </h2>
              <p className='text-muted text-lg mb-8 max-w-2xl mx-auto'>
                Join thousands of travelers who have discovered the magic of
                authentic local experiences through CityPulse.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <a
                  href='/signup'
                  className='inline-flex items-center justify-center bg-pulse text-pulse-fg hover:opacity-90 px-8 py-4 text-lg rounded-lg font-medium transition-opacity'
                >
                  Start Your Journey
                </a>
                <a
                  href='/about'
                  className='inline-flex items-center justify-center border border-subtle text-primary hover:bg-surface-glass px-8 py-4 text-lg rounded-lg font-medium transition-colors'
                >
                  Learn More
                </a>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
