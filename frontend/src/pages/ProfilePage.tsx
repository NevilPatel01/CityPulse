import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '../components/ui/card';

// Mock badges and stats for demo
const mockBadges = [
  { icon: '🏔️', label: 'Mountains' },
  { icon: '🍜', label: 'Foodie' },
  { icon: '🌐', label: 'Globetrotter' },
  { icon: '🧭', label: 'Explorer' },
  { icon: '📍', label: 'Local Expert' },
];

const mockStats = [
  { label: 'Cities', value: 24 },
  { label: 'Recommendations', value: 47 },
  { label: 'Travel Buddies', value: 156 },
  { label: 'Points', value: 8420 },
];

const mockTabs = [
  'My Recommendations',
  'Travel History',
  'Achievements',
  'Saved',
];

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Mock profile data for testing
  const profile =
    currentUser && currentUser.username === username
      ? {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          fullName: currentUser.fullName,
          bio: 'Tech nomad exploring Asia. Coffee lover and startup enthusiast. Always seeking the perfect mountain trail and hidden local gems. 🏔️☕',
          currentLocation: 'Tokyo, Japan',
          hometown: 'Seoul, South Korea',
          coverPhotoUrl:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
          profilePhotoUrl: '',
          badges: mockBadges,
          stats: mockStats,
          createdAt: currentUser.createdAt || new Date().toISOString(),
          socialLinks: [
            { icon: '🌐', url: 'https://alexkim.com', label: 'Website' },
            {
              icon: '📸',
              url: 'https://instagram.com/alexkim',
              label: 'Instagram',
            },
            {
              icon: '🐦',
              url: 'https://twitter.com/alexkim',
              label: 'Twitter',
            },
          ],
          interests: [
            'Tokyo, Japan',
            'Seoul, South Korea',
            'Bangkok, Thailand',
          ],
        }
      : null;

  if (!profile) {
    return (
      <div className='min-h-screen bg-base'>
        <Header />
        <main className='pt-16 px-4 py-8'>
          <div className='max-w-4xl mx-auto'>
            <Card>
              <CardContent className='text-center'>
                <CardTitle as='h1' className='mb-4'>
                  Profile Not Found
                </CardTitle>
                <CardDescription>
                  The profile you are looking for does not exist.
                </CardDescription>
                <button
                  onClick={() => navigate('/dashboard')}
                  className='bg-pulse text-white px-6 py-2 rounded-lg hover:opacity-90 mt-6'
                >
                  Back to Dashboard
                </button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-base'>
      <Header />
      <main className='pt-16'>
        {/* Cover Photo & Avatar */}
        <div className='relative w-full h-48 md:h-64 bg-gradient-to-r from-pulse/20 to-pulse/40'>
          <img
            src={profile.coverPhotoUrl}
            alt='Cover'
            className='w-full h-full object-cover rounded-b-2xl'
          />
          <div className='absolute left-1/2 -bottom-16 md:-bottom-20 transform -translate-x-1/2'>
            <div className='w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-base overflow-hidden bg-pulse flex items-center justify-center'>
              {profile.profilePhotoUrl ? (
                <img
                  src={profile.profilePhotoUrl}
                  alt={profile.fullName}
                  className='w-full h-full object-cover'
                />
              ) : (
                <span className='text-white text-4xl md:text-5xl font-bold'>
                  {profile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className='container mx-auto px-4 pt-24 md:pt-32 pb-8'>
          <div className='grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8'>
            {/* Sidebar Stats & Badges */}
            <aside className='space-y-6'>
              <Card>
                <CardContent>
                  <div className='grid grid-cols-2 md:grid-cols-2 gap-4 mb-4'>
                    {profile.stats.map((stat, idx) => (
                      <div key={idx} className='text-center'>
                        <div className='text-2xl md:text-3xl font-bold text-pulse'>
                          {stat.value}
                        </div>
                        <div className='text-sm text-muted'>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className='mt-6'>
                    <h3 className='text-lg font-semibold text-primary mb-2'>
                      Badges
                    </h3>
                    <div className='flex flex-wrap gap-3'>
                      {profile.badges.map((badge, idx) => (
                        <div
                          key={idx}
                          className='w-10 h-10 bg-surface-glass rounded-lg flex flex-col items-center justify-center text-xl'
                        >
                          <span>{badge.icon}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <button className='w-full bg-surface-glass border border-subtle text-primary py-2 rounded-lg mb-3 hover:bg-pulse/10'>
                    Settings
                  </button>
                  <button className='w-full border border-pulse text-pulse py-2 rounded-lg hover:bg-pulse/10'>
                    Share Profile
                  </button>
                </CardContent>
              </Card>
            </aside>

            {/* Main Profile Info & Tabs */}
            <section className='space-y-6'>
              <Card>
                <CardContent>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4'>
                    <div>
                      <h1 className='text-3xl md:text-4xl font-bold text-primary'>
                        {profile.fullName}
                      </h1>
                      <p className='text-muted text-lg'>@{profile.username}</p>
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {profile.interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className='bg-pulse/20 text-pulse px-3 py-1 rounded-full text-sm'
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className='flex gap-3'>
                      {profile.socialLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-xl hover:text-pulse transition-colors'
                          aria-label={link.label}
                        >
                          {link.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                  <p className='text-primary text-lg mb-4'>{profile.bio}</p>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Card>
                <CardHeader className='flex gap-2 border-b-0 pb-0'>
                  {mockTabs.map((tab, idx) => (
                    <button
                      key={tab}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                        activeTab === idx
                          ? 'bg-pulse text-pulse-fg'
                          : 'text-primary hover:bg-surface-glass'
                      }`}
                      onClick={() => setActiveTab(idx)}
                    >
                      {tab}
                    </button>
                  ))}
                </CardHeader>
                <CardContent>
                  {/* Tab Content - Demo only */}
                  {activeTab === 0 && (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                      {/* Recommendations cards - demo */}
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <img
                            src='https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80'
                            alt='Mount Snowdon'
                            className='w-full h-32 object-cover rounded-lg mb-3'
                          />
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Mount Snowdon Summit Trail
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Tokyo, Japan
                          </p>
                          <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                            Hiking & Trails
                          </span>
                        </CardContent>
                      </Card>
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <img
                            src='https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
                            alt='Shibuya'
                            className='w-full h-32 object-cover rounded-lg mb-3'
                          />
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Shibuya Sky Observatory
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Tokyo, Japan
                          </p>
                          <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                            Viewpoints
                          </span>
                        </CardContent>
                      </Card>
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <img
                            src='https://images.unsplash.com/photo-1519864600265-abb224a0e3c7?auto=format&fit=crop&w=400&q=80'
                            alt='Tsukiji'
                            className='w-full h-32 object-cover rounded-lg mb-3'
                          />
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Tsukiji Outer Market
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Tokyo, Japan
                          </p>
                          <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                            Food & Markets
                          </span>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {activeTab === 1 && (
                    <div className='space-y-6'>
                      {/* Travel History cards - demo */}
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Snowdonia, Wales
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Dec 10-17, 2024
                          </p>
                          <div className='flex flex-wrap gap-2 mt-2'>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Mount Snowdon Summit
                            </span>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Llanberis Railway
                            </span>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Betws-y-Coed
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Tokyo, Japan
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Nov 15 - Dec 5, 2024
                          </p>
                          <div className='flex flex-wrap gap-2 mt-2'>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Shibuya Sky
                            </span>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Tsukiji Market
                            </span>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Senso-ji Temple
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Seoul, South Korea
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Oct 10-25, 2024
                          </p>
                          <div className='flex flex-wrap gap-2 mt-2'>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Han River Park
                            </span>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Bukchon Village
                            </span>
                            <span className='bg-pulse/20 text-pulse px-2 py-1 rounded-full text-xs'>
                              Namsan Tower
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {activeTab === 2 && (
                    <div className='space-y-6'>
                      {/* Achievements - demo */}
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Badge: Globetrotter
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Visited 20+ countries
                          </p>
                        </CardContent>
                      </Card>
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Badge: Local Expert
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            Top-rated recommendations in Tokyo
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {activeTab === 3 && (
                    <div className='space-y-6'>
                      {/* Saved - demo */}
                      <Card className='bg-surface-glass'>
                        <CardContent>
                          <h3 className='text-lg font-semibold text-primary mb-1'>
                            Saved: Brooklyn Bridge Park
                          </h3>
                          <p className='text-muted text-sm mb-1'>
                            New York, NY
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
