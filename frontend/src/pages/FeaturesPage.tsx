import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent } from '../components/ui/card';
import { 
  MapPin, Users, Search, Award, Plane, Shield,
  Heart, Bookmark, Filter, TrendingUp, Calendar,
  Lock, Star, Bell, Image
} from 'lucide-react';

const FeaturesPage = () => {

  const mainFeatures = [
    {
      icon: MapPin,
      title: 'City Recommendations',
      description:
        'Create and share detailed recommendations for attractions, local foods, shops, hikes, and unique experiences.',
      details: [
        'Upload multiple photos with descriptions',
        'Add location data and price ranges',
        'Set difficulty levels and categories',
        'Tag recommendations for easy discovery',
      ],
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Users,
      title: 'Travel Buddy Connections',
      description:
        'Connect with fellow travelers or locals. Send buddy requests and access social media profiles once connected.',
      details: [
        'Send and manage connection requests',
        'View connected buddies\' social profiles',
        'Access contact information of connections',
        'Build a trusted network for meetups',
      ],
      color: 'text-pulse',
      bgColor: 'bg-pulse/10',
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description:
        'Discover recommendations through an interactive, searchable interface with powerful filtering capabilities.',
      details: [
        'Dropdown selection: Filter by city, category type, difficulty level',
        'Numeric range: Price range slider, rating range (1-5 stars)',
        'Tag/Category filter: Multiple tag selection (budget-friendly, family-friendly, adventure)',
        'Date range: Filter by when recommendations were added',
        'Multiple filters work simultaneously with structured grid/list display',
      ],
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Award,
      title: 'Travel History & Achievements',
      description:
        'Track visited cities in a LinkedIn-style format and earn badges for milestones and contributions.',
      details: [
        'Track visited cities with dates and impact metrics (views, ratings received)',
        'Earn badges for milestones (first recommendation, 10 cities visited, top-rated content creator)',
        'Track progress towards achievements and display badges on profile',
        'Achievement sharing and notifications with leaderboard participation',
      ],
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: Plane,
      title: 'Find Travel Companions',
      description:
        'Plan collaborative trips by specifying destination, dates, and requirements to find like-minded travel companions.',
      details: [
        'Specify trip details and dates',
        'Set companion requirements',
        'Send collaboration requests',
        'Plan trips together',
      ],
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Shield,
      title: 'Community Moderation',
      description:
        'Moderators review reported content to maintain quality and reliability of shared information.',
      details: [
        'Review reported content for accuracy',
        'Remove inappropriate posts',
        'Manage user warnings and restrictions',
        'Maintain platform quality',
      ],
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className='min-h-screen bg-base text-primary'>
      <Header />

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className='py-20 lg:py-32 px-4'>
          <div className='container mx-auto text-center'>
            <h1 className='text-4xl lg:text-6xl font-bold text-primary mb-6 leading-tight'>
              Features that <span className='text-pulse'>transform</span> travel
            </h1>
            <p className='text-xl text-muted mb-4 leading-relaxed max-w-4xl mx-auto'>
              Discover authentic, crowd-sourced travel recommendations and connect with travelers or locals in real-time for meetups, collaborative trip planning, and shared experiences.
            </p>
            <p className='text-lg text-muted mb-8 leading-relaxed max-w-4xl mx-auto'>
              CityPulse helps you discover city recommendations through an interactive, searchable interface 
              with filtering capabilities and location-based organization. Whether you're looking for the best 
              local food spots, hidden hiking trails, or travel companions for your next adventure, we've got you covered.
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
              <p className='text-muted text-lg max-w-3xl mx-auto mb-4'>
                Everything you need to experience cities like a local
              </p>
              <p className='text-muted max-w-3xl mx-auto'>
                The primary data entity is <strong className='text-primary'>City Recommendations</strong> - including 
                attraction details, local experiences, food recommendations, shops, hikes, user ratings, photos, 
                location data, and associated metadata (tags, difficulty levels, price ranges, etc.).
              </p>
            </div>

            <div className='grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto'>
              {mainFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                
                return (
                  <Card
                    key={index}
                    className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    <CardContent className='p-8'>
                      <div className='flex items-start gap-4 mb-6'>
                        <div className={`p-3 rounded-xl ${feature.bgColor} flex-shrink-0 transition-transform duration-300 hover:scale-110`}>
                          <IconComponent className={`w-8 h-8 ${feature.color}`} />
                        </div>
                        <div className='flex-1'>
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
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${feature.color.replace('text-', 'bg-')}`}></div>
                            <p className='text-muted'>{detail}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className='py-20 px-4 bg-gradient-to-b from-transparent to-surface-glass/20'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                More Features
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                Additional features that enhance your travel experience
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto'>
              {[
                {
                  icon: Heart,
                  title: 'Like & Save',
                  description: 'Like recommendations and save them to your profile for easy access later.',
                  color: 'text-red-500',
                },
                {
                  icon: Bookmark,
                  title: 'Personalized Feed',
                  description: 'Content based on your preferences, location-based recommendations, friends\' activity updates, trending content in your areas of interest, and seasonal content.',
                  color: 'text-blue-500',
                },
                {
                  icon: TrendingUp,
                  title: 'Discovery Feeds',
                  description: 'Top places this month, popular content in current country, featured destinations, and category-specific feeds (food, adventure, etc.).',
                  color: 'text-yellow-500',
                },
                {
                  icon: Filter,
                  title: 'Smart Filtering',
                  description: 'Filter recommendations by multiple criteria simultaneously.',
                  color: 'text-green-500',
                },
                {
                  icon: Calendar,
                  title: 'Travel Planning',
                  description: 'Plan your trips and track your travel history with dates.',
                  color: 'text-purple-500',
                },
                {
                  icon: Shield,
                  title: 'Privacy Controls',
                  description: 'Control your profile visibility and content sharing preferences.',
                  color: 'text-pulse',
                  bgColor: 'bg-pulse/10',
                },
                {
                  icon: Lock,
                  title: 'Secure Authentication',
                  description: 'Email validation, password strength checker, secure storage with bcrypt, and optional Google login.',
                  color: 'text-orange-500',
                },
                {
                  icon: Star,
                  title: 'Rating & Reviews',
                  description: 'Rate recommendations (1-5 stars) and provide detailed reviews to help other travelers.',
                  color: 'text-yellow-500',
                },
                {
                  icon: Bell,
                  title: 'Real-time Notifications',
                  description: 'Get alerts for connection requests, likes, achievement unlocks, and system announcements.',
                  color: 'text-pink-500',
                },
                {
                  icon: Image,
                  title: 'Photo Management',
                  description: 'Upload multiple photos per recommendation with captions, descriptions, and image optimization.',
                  color: 'text-cyan-500',
                },
              ].map((feature, index) => {
                const IconComponent = feature.icon;
                const isLastInRow = (index + 1) % 3 === 0 || index === 9; // Last item (Photo Management) should be centered
                const isPrivacyControl = feature.title === 'Privacy Controls';
                
                return (
                  <Card
                    key={index}
                    className={`bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${isLastInRow && index === 9 ? 'md:col-start-2 lg:col-start-auto' : ''}`}
                  >
                    <CardContent className='p-6'>
                      <div className={`inline-flex p-3 rounded-lg mb-4 ${
                        isPrivacyControl 
                          ? 'bg-pulse text-pulse' 
                          : feature.bgColor || feature.color.replace('text-', 'bg-').replace('-500', '-500/10')
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          isPrivacyControl ? 'text-pulse' : feature.color
                        }`} />
                      </div>
                      <h3 className='text-lg font-semibold text-primary mb-2'>
                        {feature.title}
                      </h3>
                      <p className='text-muted leading-relaxed text-sm'>
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
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
                    'Set up your profile with travel preferences, interests, and social links.',
                },
                {
                  step: '2',
                  title: 'Share Recommendations',
                  description:
                    'Create and share city recommendations for attractions, food, shops, and hikes.',
                },
                {
                  step: '3',
                  title: 'Connect & Discover',
                  description:
                    'Find travel buddies, search recommendations, and discover new places.',
                },
                {
                  step: '4',
                  title: 'Track & Achieve',
                  description:
                    'Track your travel history and earn achievement badges for milestones.',
                },
              ].map((step, index) => {
                return (
                  <Card
                    key={index}
                    className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg hover:shadow-xl text-center transition-all duration-300 hover:scale-[1.02]'
                  >
                    <CardContent className='p-6'>
                      <div className='w-16 h-16 rounded-full bg-pulse text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg transition-transform duration-300 hover:scale-110'>
                        {step.step}
                      </div>
                      <h3 className='text-lg font-semibold text-primary mb-3'>
                        {step.title}
                      </h3>
                      <p className='text-muted leading-relaxed text-sm'>
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
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
