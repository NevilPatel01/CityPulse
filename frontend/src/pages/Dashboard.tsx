import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useFeed } from '../hooks/useFeed';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import { TripFeedCard } from '../components/trips/TripFeedCard';
import { getUserStats, getActiveBuddies } from '../services/feedService';
import type { UserStats, ActiveBuddy } from '../services/feedService';
import type { Trip } from '../types/trip';
import { Loader2, MapPin } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { CreateRecommendationForm } from '../components/recommendations/CreateRecommendationForm';

// Dashboard Components
const QuickActionsCard = ({ onAddRecommendation }: { onAddRecommendation: () => void }) => {
    const navigate = useNavigate();
    
    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Quick Actions</h3>
            <button 
                onClick={onAddRecommendation}
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
    const { user } = useAuth();
    
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
            onClick: () => navigate(`/profile/${user?.username}?tab=0`)
        },
        { 
            label: "Cities Visited", 
            value: stats.citiesVisited,
            onClick: () => navigate(`/profile/${user?.username}?tab=1`)
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

const InterestsCard = ({ 
    selectedInterest, 
    onSelectInterest 
}: { 
    selectedInterest: string | null;
    onSelectInterest: (interest: string | null) => void;
}) => {
    const interests = ["Coffee", "Food", "Hiking", "Places", "Culture"];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-primary">Interests</h3>
                {selectedInterest && (
                    <button
                        onClick={() => onSelectInterest(null)}
                        className="text-xs text-pulse hover:text-pulse/80"
                    >
                        Clear
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                    <span
                        key={index}
                        onClick={() => onSelectInterest(interest === selectedInterest ? null : interest)}
                        className={`px-3 py-1 rounded-full text-sm border cursor-pointer transition-colors ${
                            interest === selectedInterest
                                ? 'bg-pulse text-white border-pulse'
                                : 'bg-white/10 text-primary border-white/20 hover:bg-white/20'
                        }`}
                    >
                        {interest}
                    </span>
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
    const navigate = useNavigate();
    const links = [
        { label: "Saved Places", path: "/profile" },
        { label: "Trip Planning", path: "/trips" },
        { label: "Local Events", path: "/explore" },
        { label: "Settings", path: "/settings" }
    ];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Quick Links</h3>
            <div className="space-y-2">
                {links.map((link, index) => (
                    <div 
                        key={index} 
                        onClick={() => navigate(link.path)}
                        className="text-sm text-muted hover:text-primary cursor-pointer hover:bg-white/5 p-2 -m-2 rounded transition-colors"
                    >
                        {link.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    
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
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
    const [showRecommendationModal, setShowRecommendationModal] = useState(false);

    // Separate posts by content type and filter/sort
    const recommendations = posts
        .filter(post => 
            post.content_type === 'recommendation' &&
            (!selectedInterest || post.category_name?.toLowerCase() === selectedInterest.toLowerCase()) &&
            post.username !== user?.username
        )
        .sort((a, b) => {
            // Posts with images come first
            const aHasImage = (a.photos && a.photos.length > 0) ? 1 : 0;
            const bHasImage = (b.photos && b.photos.length > 0) ? 1 : 0;
            return bHasImage - aHasImage;
        });
    
    const trips = posts.filter(post => post.content_type === 'trip');
    
    // Combine filtered recommendations and all trips
    const filteredPosts = [...recommendations, ...trips];

    // Load sidebar data
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsRes, buddiesRes] = await Promise.all([
                    getUserStats().catch(err => {
                        console.error('Failed to load user stats:', err);
                        return { data: { recommendations: 0, citiesVisited: 0, buddies: 0, likesReceived: 0, totalViews: 0 } };
                    }),
                    getActiveBuddies(10).catch(err => {
                        console.error('Failed to load active buddies:', err);
                        return { data: [] };
                    })
                ]);

                setStats(statsRes.data);
                setBuddies(buddiesRes.data);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                // Set default values to prevent UI crash
                setStats({ recommendations: 0, citiesVisited: 0, buddies: 0, likesReceived: 0, totalViews: 0 });
                setBuddies([]);
            }
        };

        if (isAuthenticated && !authLoading) {
            loadDashboardData();
        }
    }, [isAuthenticated, authLoading]);

    // Handle recommendation creation success
    const handleRecommendationSuccess = () => {
        setShowRecommendationModal(false);
        refresh(); // Refresh the feed
    };

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
                        <QuickActionsCard onAddRecommendation={() => setShowRecommendationModal(true)} />
                        <InterestsCard 
                            selectedInterest={selectedInterest}
                            onSelectInterest={setSelectedInterest}
                        />

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-primary">
                                    {selectedInterest ? `${selectedInterest} Recommendations` : 'Your Feed'}
                                </h2>
                                <button 
                                    onClick={refresh}
                                    className="text-sm text-pulse hover:text-pulse/80"
                                >
                                    Refresh
                                </button>
                            </div>
                            <div className="space-y-4">
                                {feedLoading && filteredPosts.length === 0 ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="animate-spin text-pulse" size={32} />
                                    </div>
                                ) : filteredPosts.length === 0 ? (
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
                                        {filteredPosts.map((post) => (
                                            post.content_type === 'trip' ? (
                                                <TripFeedCard 
                                                    key={`trip-${post.id}`} 
                                                    trip={post as unknown as Trip}
                                                />
                                            ) : (
                                                <FeedPostCard 
                                                    key={`rec-${post.id}`} 
                                                    post={post} 
                                                    onUpdate={updatePost}
                                                    onRemove={removePost}
                                                />
                                            )
                                        ))}
                                        
                                        {/* Infinite scroll trigger */}
                                        <div ref={observerTarget} className="py-4 text-center">
                                            {feedLoading && !selectedInterest && (
                                                <Loader2 className="animate-spin text-pulse mx-auto" size={24} />
                                            )}
                                            {!hasMore && filteredPosts.length > 0 && !selectedInterest && (
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
                            <QuickActionsCard onAddRecommendation={() => setShowRecommendationModal(true)} />
                            <YourStatsCard stats={stats} />
                            <InterestsCard 
                                selectedInterest={selectedInterest}
                                onSelectInterest={setSelectedInterest}
                            />
                        </div>

                        {/* Center Feed */}
                        <div className="space-y-6">
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-primary">
                                        {selectedInterest ? `${selectedInterest} Recommendations` : 'Your Feed'}
                                    </h2>
                                    <button 
                                        onClick={refresh}
                                        className="text-sm text-pulse hover:text-pulse/80 flex items-center gap-2"
                                    >
                                        <MapPin size={16} />
                                        Refresh
                                    </button>
                                </div>
                                
                                {feedLoading && filteredPosts.length === 0 ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="animate-spin text-pulse" size={40} />
                                    </div>
                                ) : filteredPosts.length === 0 ? (
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
                                            {filteredPosts.map((post) => (
                                                post.content_type === 'trip' ? (
                                                    <TripFeedCard 
                                                        key={`trip-${post.id}`} 
                                                        trip={post as unknown as Trip}
                                                    />
                                                ) : (
                                                    <FeedPostCard 
                                                        key={`rec-${post.id}`} 
                                                        post={post} 
                                                        onUpdate={updatePost}
                                                        onRemove={removePost}
                                                    />
                                                )
                                            ))}
                                        </div>
                                        
                                        {/* Infinite scroll trigger */}
                                        <div ref={observerTarget} className="py-8 text-center">
                                            {feedLoading && !selectedInterest && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="animate-spin text-pulse" size={24} />
                                                    <span className="text-muted">Loading more posts...</span>
                                                </div>
                                            )}
                                            {!hasMore && filteredPosts.length > 0 && !selectedInterest && (
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
                            <ActiveBuddiesCard buddies={buddies} />
                            <QuickLinksCard />
                        </div>
                    </div>
                </main>
            </div>

            {/* Recommendation Creation Modal */}
            <Modal
                isOpen={showRecommendationModal}
                onClose={() => setShowRecommendationModal(false)}
                title="Create Recommendation"
                size="xl"
            >
                <CreateRecommendationForm
                    onSuccess={handleRecommendationSuccess}
                    onCancel={() => setShowRecommendationModal(false)}
                />
            </Modal>
        </div>
    );
}
