import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useFeed } from '../hooks/useFeed';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import { getUserStats, getActiveBuddies, getTrendingPosts } from '../services/feedService';
import type { UserStats, ActiveBuddy } from '../services/feedService';
import { Loader2, MapPin } from 'lucide-react';

// Types
interface RecommendationCardProps {
    title: string;
    location: string;
    rating: number;
    category: string;
    image: string;
}

// Dashboard Components
const QuickActionsCard = () => {
    const navigate = useNavigate();
    
    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Quick Actions</h3>
            <button 
                onClick={() => navigate('/create-recommendation')}
                className="w-full bg-pulse text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-pulse/90 transition-colors"
            >
                Add Recommendation
            </button>
            <button 
                onClick={() => navigate('/buddies')}
                className="w-full bg-white/10 text-primary py-2 px-4 rounded-lg text-sm font-medium border border-white/20 hover:bg-white/20 transition-colors"
            >
                Find Buddy
            </button>
        </div>
    );
};

const YourStatsCard = ({ stats }: { stats: UserStats | null }) => {
    const navigate = useNavigate();
    
    if (!stats) {
        return (
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4">
                <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-white/10 rounded w-1/2"></div>
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 bg-white/10 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const statItems = [
        { 
            label: "Recommendations", 
            value: stats.recommendations,
            onClick: () => navigate('/my-recommendations')
        },
        { 
            label: "Cities Visited", 
            value: stats.citiesVisited,
            onClick: () => navigate('/cities')
        },
        { 
            label: "Buddies", 
            value: stats.buddies,
            onClick: () => navigate('/buddies')
        },
    ];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Your Stats</h3>
            <div className="space-y-2">
                {statItems.map((stat, index) => (
                    <div 
                        key={index} 
                        className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 -m-2 rounded transition-colors"
                        onClick={stat.onClick}
                    >
                        <span className="text-sm text-muted">{stat.label}</span>
                        <span className="font-semibold text-primary">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const InterestsCard = () => {
    const interests = ["Coffee", "Food", "Hiking", "Places", "Culture"];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Interests</h3>
            <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                    <span
                        key={index}
                        className="bg-white/10 text-primary px-3 py-1 rounded-full text-sm border border-white/20"
                    >
                        {interest}
                    </span>
                ))}
            </div>
        </div>
    );
};

const RecommendationCard = ({ title, location, rating, category, image }: RecommendationCardProps) => (
    <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl overflow-hidden cursor-pointer hover:bg-white/12 transition-all">
        <div className="relative h-40 overflow-hidden">
            <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
                <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {category}
                </span>
            </div>
        </div>
        <div className="p-4">
            <h3 className="font-semibold text-primary mb-1">{title}</h3>
            <p className="text-sm text-muted mb-2">{location}</p>
            <div className="flex items-center gap-1">
                <span className="text-[var(--accent-amber)]">★</span>
                <span className="text-sm font-medium text-primary">{rating}</span>
            </div>
        </div>
    </div>
);

const TrendingCard = ({ title, location, rating, category, image, onClick }: RecommendationCardProps & { onClick?: () => void }) => (
    <div 
        className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl overflow-hidden cursor-pointer hover:bg-white/12 transition-all"
        onClick={onClick}
    >
        <div className="relative h-32 overflow-hidden">
            <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
                <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {category}
                </span>
            </div>
        </div>
        <div className="p-3">
            <h4 className="font-medium text-primary text-sm mb-1">{title}</h4>
            <p className="text-xs text-muted mb-1">{location}</p>
            <div className="flex items-center gap-1">
                <span className="text-[var(--accent-amber)] text-sm">★</span>
                <span className="text-xs font-medium text-primary">{rating}</span>
            </div>
        </div>
    </div>
);

const TrendingNowCard = ({ trending }: { trending: any[] }) => {
    const navigate = useNavigate();
    
    if (!trending || trending.length === 0) {
        return (
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4">
                <h3 className="font-semibold text-primary mb-3">Trending Now</h3>
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="h-32 bg-white/10 rounded-xl mb-2"></div>
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Trending Now</h3>
            <div className="space-y-3">
                {trending.slice(0, 3).map((place) => (
                    <TrendingCard 
                        key={place.id} 
                        title={place.title}
                        location={`${place.city_name}, ${place.country}`}
                        rating={place.user_rating}
                        category={place.category_name}
                        image={place.photos?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop'}
                        onClick={() => navigate(`/recommendation/${place.id}`)}
                    />
                ))}
            </div>
        </div>
    );
};

const ActiveBuddiesCard = ({ buddies }: { buddies: ActiveBuddy[] }) => {
    const navigate = useNavigate();
    
    if (!buddies || buddies.length === 0) {
        return (
            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-primary">Active Buddies</h3>
                <div className="text-center py-4">
                    <p className="text-sm text-muted mb-3">No buddies yet</p>
                    <button 
                        onClick={() => navigate('/buddies')}
                        className="text-sm text-pulse hover:text-pulse/80"
                    >
                        Find Buddies
                    </button>
                </div>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const isRecent = (lastActive: string) => {
        const now = new Date();
        const active = new Date(lastActive);
        const diffHours = (now.getTime() - active.getTime()) / (1000 * 60 * 60);
        return diffHours < 24; // Active within last 24 hours
    };

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Active Buddies</h3>
            <div className="space-y-3">
                {buddies.slice(0, 4).map((buddy) => (
                    <div 
                        key={buddy.id} 
                        className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 -m-2 rounded transition-colors"
                        onClick={() => navigate(`/profile/${buddy.username}`)}
                    >
                        <div className="relative">
                            {buddy.profile_picture_url ? (
                                <img 
                                    src={buddy.profile_picture_url} 
                                    alt={buddy.full_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-pulse rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-semibold">
                                        {getInitials(buddy.full_name)}
                                    </span>
                                </div>
                            )}
                            {buddy.last_active && isRecent(buddy.last_active) && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border border-base"></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">{buddy.full_name}</p>
                            <p className="text-xs text-muted truncate">
                                {buddy.current_city || 'Exploring'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {buddies.length > 4 && (
                <button 
                    onClick={() => navigate('/buddies')}
                    className="w-full text-center text-sm text-pulse hover:text-pulse/80 pt-2"
                >
                    View all buddies
                </button>
            )}
        </div>
    );
};

const QuickLinksCard = () => {
    const links = ["Saved Places", "Trip Planning", "Local Events", "Settings"];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Quick Links</h3>
            <div className="space-y-2">
                {links.map((link, index) => (
                    <div key={index} className="text-sm text-muted hover:text-primary cursor-pointer">
                        {link}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    
    // Additional auth guard for extra protection
    useAuthGuard({ requireAuth: true });
    
    // Feed with infinite scroll
    const { 
        posts, 
        loading: feedLoading, 
        hasMore, 
        loadMore, 
        updatePost,
        removePost,
        refresh 
    } = useFeed({ limit: 10, enableLocation: true });
    
    // Infinite scroll observer
    const { observerTarget } = useInfiniteScroll({
        onLoadMore: loadMore,
        isLoading: feedLoading,
        hasMore
    });

    // User stats
    const [stats, setStats] = useState<UserStats | null>(null);
    const [buddies, setBuddies] = useState<ActiveBuddy[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load sidebar data
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsRes, buddiesRes, trendingRes] = await Promise.all([
                    getUserStats(),
                    getActiveBuddies(10),
                    getTrendingPosts(1, 3, 7)
                ]);

                setStats(statsRes.data);
                setBuddies(buddiesRes.data);
                setTrending(trendingRes.data || []);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        };

        if (isAuthenticated && !authLoading) {
            loadDashboardData();
        }
    }, [isAuthenticated, authLoading]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        } else if (!authLoading && isAuthenticated) {
            setIsLoading(false);
        }
    }, [authLoading, isAuthenticated, navigate]);

    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen bg-base flex items-center justify-center">
                <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-8">
                    <div className="flex items-center space-x-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse"></div>
                        <span className="text-primary">Loading your dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base">
            <Header />

            {/* Mobile Layout */}
            <div className="lg:hidden">
                <main id="main-content" role="main" className="pb-20 pt-16">
                    <div className="space-y-6 p-4">
                        <QuickActionsCard />
                        <TrendingNowCard trending={trending} />

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-primary">Your Feed</h2>
                                <button 
                                    onClick={refresh}
                                    className="text-sm text-pulse hover:text-pulse/80"
                                >
                                    Refresh
                                </button>
                            </div>
                            <div className="space-y-4">
                                {feedLoading && posts.length === 0 ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="animate-spin text-pulse" size={32} />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="text-center py-12 bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl">
                                        <p className="text-muted mb-4">No posts yet</p>
                                        <p className="text-sm text-muted mb-6">Start following buddies or explore recommendations</p>
                                        <button 
                                            onClick={() => navigate('/explore')}
                                            className="bg-pulse text-white px-6 py-2 rounded-lg font-medium"
                                        >
                                            Explore
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {posts.map((post) => (
                                            <FeedPostCard 
                                                key={post.id} 
                                                post={post} 
                                                onUpdate={updatePost}
                                                onRemove={removePost}
                                            />
                                        ))}
                                        
                                        {/* Infinite scroll trigger */}
                                        <div ref={observerTarget} className="py-4 text-center">
                                            {feedLoading && (
                                                <Loader2 className="animate-spin text-pulse mx-auto" size={24} />
                                            )}
                                            {!hasMore && posts.length > 0 && (
                                                <p className="text-muted text-sm">You're all caught up! 🎉</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
                <BottomNavigation />
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block">
                <main id="main-content" role="main" className="pt-16">
                    <div className="grid grid-cols-[280px_1fr_320px] gap-6 container mx-auto px-4 py-6">
                        {/* Left Sidebar */}
                        <div className="space-y-6 sticky top-20 h-fit">
                            <QuickActionsCard />
                            <YourStatsCard stats={stats} />
                            <InterestsCard />
                        </div>

                        {/* Center Feed */}
                        <div className="space-y-6">
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-primary">Your Feed</h2>
                                    <button 
                                        onClick={refresh}
                                        className="text-sm text-pulse hover:text-pulse/80 flex items-center gap-2"
                                    >
                                        <MapPin size={16} />
                                        Refresh
                                    </button>
                                </div>
                                
                                {feedLoading && posts.length === 0 ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="animate-spin text-pulse" size={40} />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="text-center py-16 bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl">
                                        <p className="text-muted mb-4 text-lg">No posts in your feed yet</p>
                                        <p className="text-sm text-muted mb-6">Start following buddies or explore recommendations</p>
                                        <button 
                                            onClick={() => navigate('/explore')}
                                            className="bg-pulse text-white px-8 py-3 rounded-lg font-medium hover:bg-pulse/90 transition-colors"
                                        >
                                            Explore Recommendations
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            {posts.map((post) => (
                                                <FeedPostCard 
                                                    key={post.id} 
                                                    post={post} 
                                                    onUpdate={updatePost}
                                                    onRemove={removePost}
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Infinite scroll trigger */}
                                        <div ref={observerTarget} className="py-8 text-center">
                                            {feedLoading && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin text-pulse" size={24} />
                                                    <span className="text-muted">Loading more posts...</span>
                                                </div>
                                            )}
                                            {!hasMore && posts.length > 0 && (
                                                <div className="py-4">
                                                    <p className="text-muted">You're all caught up! 🎉</p>
                                                    <button 
                                                        onClick={refresh}
                                                        className="text-sm text-pulse hover:text-pulse/80 mt-2"
                                                    >
                                                        Refresh feed
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </section>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6 sticky top-20 h-fit">
                            <TrendingNowCard trending={trending} />
                            <ActiveBuddiesCard buddies={buddies} />
                            <QuickLinksCard />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
