import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent } from '../components/ui/card';
import { Heart, Users, MapPin, Shield } from 'lucide-react';

const AboutPage = () => {

  const values = [
    {
      icon: Heart,
      title: 'Authentic Experiences',
      description:
        'Discover authentic, crowd-sourced travel recommendations from real travelers and locals who know their cities best.',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: Users,
      title: 'Real Connections',
      description:
        'Connect with like-minded travelers or locals in real-time for meetups, collaborative trip planning, and shared experiences.',
      color: 'text-pulse',
      bgColor: 'bg-pulse/10',
    },
    {
      icon: MapPin,
      title: 'Local Knowledge',
      description:
        'Share your city knowledge and help fellow travelers discover must-see attractions, local foods, shops, hikes, and unique experiences.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Shield,
      title: 'Quality Content',
      description:
        'Community moderators ensure the quality and reliability of shared information, maintaining a trusted platform for all users.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
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
              About <span className='text-pulse'>CityPulse</span>
            </h1>
            <p className='text-xl text-muted mb-4 leading-relaxed max-w-4xl mx-auto'>
              A social network for travelers enabling users to share cities they've visited, 
              upload recommendations for must-see attractions, local foods, shops, hikes, and 
              connect with fellow travelers or locals for authentic experiences and meetups.
            </p>
            <p className='text-lg text-muted mb-8 leading-relaxed max-w-4xl mx-auto'>
              Designed for travel enthusiasts, backpackers, and locals who want to share their 
              city knowledge and connect with like-minded travelers. The main reason to use CityPulse 
              is to discover authentic, crowd-sourced travel recommendations and connect with travelers 
              or locals in real-time for meetups, collaborative trip planning, and shared experiences.
            </p>
            <div className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg rounded-2xl p-8 max-w-4xl mx-auto'>
              <h2 className='text-2xl font-semibold text-primary mb-4'>
                Our Story
              </h2>
              <p className='text-muted leading-relaxed text-lg mb-4'>
                CityPulse was created for travel enthusiasts, backpackers, and locals who want 
                to share their city knowledge and connect with like-minded travelers. Our platform 
                enables users to discover authentic, crowd-sourced travel recommendations and connect 
                with travelers or locals in real-time for meetups, collaborative trip planning, and 
                shared experiences.
              </p>
              <p className='text-muted leading-relaxed text-lg'>
                Inspired by platforms like Nomad List, Couchsurfing, and TripAdvisor, CityPulse 
                brings a unique focus on real-time meetups, collaborative trip planning, and curated 
                city recommendations—all completely free. We combine the best of traveler networking 
                with authentic local insights, creating a platform where cultural exchange and genuine 
                connections happen naturally.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className='py-20 px-4 bg-gradient-to-b from-transparent to-surface-glass/20'>
          <div className='container mx-auto'>
            <div className='grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto'>
              {[
                {
                  title: 'Our Mission',
                  description:
                    'To enable travelers to discover authentic, crowd-sourced travel recommendations and connect with travelers or locals in real-time for meetups, collaborative trip planning, and shared experiences.',
                },
                {
                  title: 'Our Vision',
                  description:
                    'A world where every traveler can share their city knowledge, connect with like-minded travelers, and discover unique experiences through a trusted community platform.',
                },
              ].map((item, index) => {
                return (
                  <Card 
                    key={index}
                    className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                <CardContent className='p-8'>
                  <h3 className='text-2xl font-bold text-primary mb-4'>
                        {item.title}
                  </h3>
                  <p className='text-muted leading-relaxed text-lg'>
                        {item.description}
                  </p>
                </CardContent>
              </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className='py-20 px-4'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Our Values
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                These principles guide everything we do at CityPulse
              </p>
            </div>

            <div className='grid md:grid-cols-2 gap-6 max-w-6xl mx-auto'>
              {values.map((value, index) => {
                const IconComponent = value.icon;
                
                return (
                <Card
                  key={index}
                    className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]'
                >
                  <CardContent className='p-6'>
                      <div className={`inline-flex p-3 rounded-xl ${value.bgColor} mb-4`}>
                        <IconComponent className={`w-6 h-6 ${value.color}`} />
                      </div>
                    <h3 className='text-xl font-semibold text-primary mb-3'>
                      {value.title}
                    </h3>
                    <p className='text-muted leading-relaxed'>
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* User Roles */}
        <section className='py-20 px-4 bg-gradient-to-b from-transparent to-surface-glass/20'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Who Uses CityPulse?
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                Two user roles, one mission: connecting travelers with authentic experiences
              </p>
            </div>

            <div className='grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto'>
              {[
                {
                  title: 'Normal Traveler',
                  icon: Users,
                  features: [
                    'Create and share city recommendations (attractions, food, shops, hikes)',
                    'Upload photos and detailed reviews for recommendations',
                    'Search and filter recommendations by location, category, price, difficulty',
                    'Send and manage Travel Buddy connection requests',
                    'View connected Travel Buddies\' social profiles and contact information',
                    'Customize profile with travel preferences, social links, and contact information',
                    'View and manage personal recommendation history and travel achievements',
                    'Track visited cities and earn achievement badges'
                  ],
                  color: 'text-pulse',
                  bgColor: 'bg-pulse/10',
                },
                {
                  title: 'Community Moderator',
                  icon: Shield,
                  features: [
                    'Includes all Regular Traveler features',
                    'Review and moderate reported content for accuracy and appropriateness',
                    'Remove inappropriate posts, photos, and user profiles',
                    'Manage user warnings, suspensions, and account restrictions',
                    'Maintain platform quality and reliability',
                    'Ensure trustworthy community standards'
                  ],
                  color: 'text-green-500',
                  bgColor: 'bg-green-500/10',
                },
              ].map((role, index) => {
                const IconComponent = role.icon;
                
                return (
                  <Card
                    key={index}
                    className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    <CardContent className='p-8'>
                      <div className='flex items-center gap-4 mb-6'>
                        <div className={`p-3 rounded-xl ${role.bgColor}`}>
                          <IconComponent className={`w-8 h-8 ${role.color}`} />
                        </div>
                        <h3 className='text-2xl font-bold text-primary'>{role.title}</h3>
                      </div>
                      <ul className='space-y-3'>
                        {role.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className='flex items-start gap-3'>
                            <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${role.color.replace('text-', 'bg-')}`}></div>
                            <span className='text-muted text-sm leading-relaxed'>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Technical Excellence */}
        <section className='py-20 px-4'>
          <div className='container mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Built with Excellence
              </h2>
              <p className='text-muted text-lg max-w-2xl mx-auto'>
                Security, accessibility, and user experience at the core
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto'>
              {[
                {
                  title: 'Mobile-First',
                  description: 'Responsive design targeting mobile and desktop devices for seamless access anywhere.',
                  color: 'text-blue-500',
                },
                {
                  title: 'Secure',
                  description: 'Protection against SQL injection, XSS attacks, and session hijacking. Secure data storage with bcrypt password hashing.',
                  color: 'text-red-500',
                },
                {
                  title: 'Accessible',
                  description: 'Full accessibility compliance with screen reader support, keyboard navigation, ARIA labels, and WCAG AA standards.',
                  color: 'text-green-500',
                },
                {
                  title: 'Reliable',
                  description: 'Robust error handling, data integrity validation, and comprehensive logging without exposing internal information.',
                  color: 'text-purple-500',
                },
              ].map((item, index) => {
                return (
                  <Card
                    key={index}
                    className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]'
                  >
                    <CardContent className='p-6'>
                      <h3 className={`text-lg font-semibold text-primary mb-2 ${item.color}`}>
                        {item.title}
                      </h3>
                      <p className='text-muted text-sm leading-relaxed'>
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className='py-20 px-4'>
          <div className='container mx-auto text-center'>
            <Card className='bg-surface-glass backdrop-blur-glass border border-subtle shadow-glass p-8 lg:p-12 max-w-4xl mx-auto'>
              <h2 className='text-3xl lg:text-4xl font-bold text-primary mb-6'>
                Get In Touch
              </h2>
              <p className='text-muted text-lg mb-8 max-w-2xl mx-auto'>
                Have questions, feedback, or want to partner with us? We'd love
                to hear from you.
              </p>
              <div className='grid md:grid-cols-3 gap-8'>
                <div>
                  <h4 className='font-semibold text-primary mb-2'>Email</h4>
                  <p className='text-muted'>hello@citypulse.com</p>
                </div>
                <div>
                  <h4 className='font-semibold text-primary mb-2'>Support</h4>
                  <p className='text-muted'>support@citypulse.com</p>
                </div>
                <div>
                  <h4 className='font-semibold text-primary mb-2'>Press</h4>
                  <p className='text-muted'>press@citypulse.com</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
