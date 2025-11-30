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
import { CategoryFilter } from '../components/dashboard/CategoryFilter';
import { 
    getUserStats, 
    getActiveBuddies, 
    getTopPlacesThisMonth,
    getBuddiesActivity
} from '../services/feedService';
import type { UserStats, ActiveBuddy, FeedPost } from '../services/feedService';
import type { Trip } from '../types/trip';
import { Loader2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Explore Components
const QuickActionsAndLinksCard = () => {
    const navigate = useNavigate();
    
    const actions = [
        {
            label: 'Add Recommendation',
            onClick: () => navigate('/create-recommendation'),
            variant: 'primary' as const
        },
        {
            label: 'Find Buddy',
            onClick: () => navigate('/travel-buddies'),
            variant: 'secondary' as const
        },
        {
            label: 'Trip Planning',
            onClick: () => navigate('/trips'),
            variant: 'secondary' as const
        },
        {
            label: 'Settings',
            onClick: () => navigate('/settings'),
            variant: 'secondary' as const
        }
    ];
    
    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-2">
            <h3 className="font-semibold text-primary mb-3">Quick Actions</h3>
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={action.onClick}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        action.variant === 'primary'
                            ? 'bg-pulse text-white hover:bg-pulse/90 shadow-md shadow-pulse/20'
                            : 'bg-white/5 text-primary border border-white/20 hover:bg-white/10 hover:border-white/30'
                    }`}
                >
                    {action.label}
                </button>
            ))}
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
            onClick: () => navigate('/travel-buddies')
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

const ActiveBuddiesCard = ({ buddies }: { buddies: ActiveBuddy[] }) => {
    const navigate = useNavigate();
    
    if (!buddies || buddies.length === 0) {
        return (
            <div className="bg-surface-glass border border-subtle rounded-2xl p-4 space-y-3 overflow-hidden">
                <h3 className="font-semibold text-primary">Active Buddies</h3>
                <div className="text-center py-4">
                    <p className="text-sm text-muted mb-3">No buddies yet</p>
                    <button 
                        onClick={() => navigate('/travel-buddies')}
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
        return diffHours < 24;
    };

    return (
        <div className="bg-surface-glass border border-subtle rounded-2xl p-4 space-y-3 overflow-hidden">
            <h3 className="font-semibold text-primary">Active Buddies</h3>
            <div className="space-y-3">
                {buddies.slice(0, 4).map((buddy) => (
                    <div 
                        key={buddy.id} 
                        className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 -m-2 rounded transition-colors"
                        onClick={() => navigate(`/profile/${buddy.username}`)}
                    >
                        <div className="relative">
                            {buddy.profile_photo_url ? (
                                <img 
                                    src={buddy.profile_photo_url} 
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
                    onClick={() => navigate('/travel-buddies')}
                    className="w-full text-center text-sm text-pulse hover:text-pulse/80 pt-2"
                >
                    View all buddies
                </button>
            )}
        </div>
    );
};

// Feed Section Component
const FeedSection = ({ 
    title, 
    icon: Icon, 
    posts, 
    loading, 
    emptyMessage,
    onUpdate,
    onRemove
}: { 
    title: string; 
    icon: LucideIcon;
    posts: FeedPost[]; 
    loading: boolean;
    emptyMessage?: string;
    onUpdate?: (id: number, updates: Partial<FeedPost>) => void;
    onRemove?: (id: number) => void;
}) => {
    if (loading) {
        return (
            <div className="space-y-4">
                {title && (
                    <div className="flex items-center gap-2">
                        {Icon && <Icon size={20} className="text-pulse" />}
                        <h3 className="text-lg font-semibold text-primary">{title}</h3>
                    </div>
                )}
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-pulse" size={24} />
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        if (!emptyMessage) return null;
        return (
            <div className="space-y-4">
                {title && (
                    <div className="flex items-center gap-2">
                        {Icon && <Icon size={20} className="text-pulse" />}
                        <h3 className="text-lg font-semibold text-primary">{title}</h3>
                    </div>
                )}
                <div className="text-center py-8 bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl">
                    <p className="text-sm text-muted">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {title && (
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={20} className="text-pulse" />}
                    <h3 className="text-lg font-semibold text-primary">{title}</h3>
                </div>
            )}
            <div className="space-y-4">
                {posts.map((post, index) => (
                    post.content_type === 'trip' ? (
                        <TripFeedCard 
                            key={`trip-${post.id}-${index}`} 
                            trip={post as unknown as Trip}
                        />
                    ) : (
                        <FeedPostCard 
                            key={`rec-${post.id}-${index}`} 
                            post={post} 
                            onUpdate={onUpdate}
                            onRemove={onRemove}
                        />
                    )
                ))}
            </div>
        </div>
    );
};

export default function Explore() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    
    useAuthGuard({ requireAuth: true });
    
    // Main feed with infinite scroll
    const { 
        posts, 
        loading: feedLoading, 
        hasMore, 
        loadMore, 
        updatePost,
        removePost,
        refresh 
    } = useFeed({ limit: 10, enableLocation: true });
    
    const { observerTarget } = useInfiniteScroll({
        onLoadMore: loadMore,
        isLoading: feedLoading,
        hasMore
    });

    // Feed sections state
    const [topPlacesThisMonth, setTopPlacesThisMonth] = useState<FeedPost[]>([]);
    const [loadingTopPlaces, setLoadingTopPlaces] = useState(true);
    const [buddiesActivity, setBuddiesActivity] = useState<FeedPost[]>([]);
    const [loadingBuddiesActivity, setLoadingBuddiesActivity] = useState(true);

    // User stats
    const [stats, setStats] = useState<UserStats | null>(null);
    const [buddies, setBuddies] = useState<ActiveBuddy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'top-places' | 'friends-updates' | 'feed'>('feed');

    // Load feed sections
    useEffect(() => {
        const loadFeedSections = async () => {
            if (!isAuthenticated || authLoading) return;

            try {
                const [topPlacesRes, buddiesRes] = await Promise.all([
                    getTopPlacesThisMonth(1, 6).catch(() => ({ success: false, data: [] })),
                    getBuddiesActivity(1, 10).catch(() => ({ success: false, data: [] }))
                ]);

                if (topPlacesRes.success) {
                    setTopPlacesThisMonth(topPlacesRes.data);
                }
                setLoadingTopPlaces(false);

                if (buddiesRes.success) {
                    setBuddiesActivity(buddiesRes.data);
                }
                setLoadingBuddiesActivity(false);
            } catch (error) {
                console.error('Error loading feed sections:', error);
                setLoadingTopPlaces(false);
                setLoadingBuddiesActivity(false);
            }
        };

        loadFeedSections();
    }, [isAuthenticated, authLoading]);

    // Helper function to filter posts by category
    const filterByCategory = (post: FeedPost): boolean => {
        if (!selectedInterest) return true; // Show all if no category selected
        // For recommendations, check category_name
        if (post.content_type === 'recommendation') {
            return post.category_name?.toLowerCase() === selectedInterest.toLowerCase();
        }
        // For trips, show them regardless of category (trips don't have categories)
        // Or if you want to filter trips too when they have categories, uncomment below:
        // return post.category_name?.toLowerCase() === selectedInterest.toLowerCase();
        return true; // Show all trips
    };

    // Separate posts by content type and filter/sort
    const recommendations = posts
        .filter(post => 
            post.content_type === 'recommendation' &&
            filterByCategory(post) &&
            post.username !== user?.username
        )
        .sort((a, b) => {
            const aHasImage = (a.photos && a.photos.length > 0) ? 1 : 0;
            const bHasImage = (b.photos && b.photos.length > 0) ? 1 : 0;
            return bHasImage - aHasImage;
        });
    
    const trips = posts.filter(post => post.content_type === 'trip' && filterByCategory(post));
    const filteredPosts = [...recommendations, ...trips];

    // Filter Top Places This Month by category
    const filteredTopPlaces = topPlacesThisMonth.filter(filterByCategory);

    // Filter Buddies Activity by category
    const filteredBuddiesActivity = buddiesActivity.filter(filterByCategory);

    // Load sidebar data
    useEffect(() => {
        const loadExploreData = async () => {
            try {
                const [statsRes, buddiesRes] = await Promise.all([
                    getUserStats().catch(err => {
                        console.error('Failed to load user stats:', err);
                        return { success: false, data: { recommendations: 0, citiesVisited: 0, buddies: 0, likesReceived: 0, totalViews: 0 } };
                    }),
                    getActiveBuddies(10).catch(err => {
                        console.error('Failed to load active buddies:', err);
                        return { success: false, data: [] };
                    })
                ]);

                setStats(statsRes.data);
                setBuddies(buddiesRes.data);
            } catch (error) {
                console.error('Error loading explore data:', error);
                setStats({ recommendations: 0, citiesVisited: 0, buddies: 0, likesReceived: 0, totalViews: 0 });
                setBuddies([]);
            }
        };

        if (isAuthenticated && !authLoading) {
            loadExploreData();
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
                        <span className="text-primary">Loading explore...</span>
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
                    <div className="space-y-4 p-4">
                        {/* Sidebar Cards */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <QuickActionsAndLinksCard />
                            {/* Category Filters */}
                            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 shadow-lg">
                                <h3 className="font-semibold text-primary mb-3">Filter by Category</h3>
                                <CategoryFilter 
                                    selectedInterest={selectedInterest}
                                    onSelectInterest={setSelectedInterest}
                                />
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-2 sticky top-16 z-10 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setActiveTab('top-places')}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-300 flex items-center gap-2 ${
                                        activeTab === 'top-places'
                                            ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                            : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                    }`}
                                >
                                    <TrendingUp size={16} />
                                    <span>Top Places This Month</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('friends-updates')}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-300 flex items-center gap-2 ${
                                        activeTab === 'friends-updates'
                                            ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                            : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                    }`}
                                >
                                    <Users size={16} />
                                    <span>Friends' Updates</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('feed')}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-300 flex items-center gap-2 ${
                                        activeTab === 'feed'
                                            ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                            : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                    }`}
                                >
                                    <span>Your Feed</span>
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                                {activeTab === 'top-places' && (
                                    <div className="space-y-4">
                                        <FeedSection
                                            title=""
                                            icon={TrendingUp}
                                            posts={filteredTopPlaces}
                                            loading={loadingTopPlaces}
                                            emptyMessage={selectedInterest 
                                                ? `No ${selectedInterest} places trending this month yet.`
                                                : "No trending places this month yet. Be the first to add a recommendation!"
                                            }
                                            onUpdate={updatePost}
                                            onRemove={removePost}
                                        />
                                    </div>
                                )}

                                {activeTab === 'friends-updates' && (
                                    <div className="space-y-4">
                                        <FeedSection
                                            title=""
                                            icon={Users}
                                            posts={filteredBuddiesActivity}
                                            loading={loadingBuddiesActivity}
                                            emptyMessage={selectedInterest
                                                ? `No ${selectedInterest} updates from your travel buddies yet.`
                                                : "No updates from your travel buddies yet. Connect with more travelers to see their activity!"
                                            }
                                            onUpdate={updatePost}
                                            onRemove={removePost}
                                        />
                                    </div>
                                )}

                            {activeTab === 'feed' && (
                                <div className="space-y-4">
                                    {/* Main Feed Header */}
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-primary">
                                            {selectedInterest ? `${selectedInterest} Feed` : 'Your Feed'}
                                        </h2>
                                        <button 
                                            onClick={refresh}
                                            className="flex items-center gap-1.5 text-sm text-pulse hover:text-pulse/80 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <RefreshCw size={14} className={feedLoading ? 'animate-spin' : ''} />
                                            <span>Refresh</span>
                                        </button>
                                    </div>

                                    {/* Main Feed */}
                                    <div className="space-y-4">
                                        {feedLoading && filteredPosts.length === 0 ? (
                                            <div className="flex justify-center py-12">
                                                <Loader2 className="animate-spin text-pulse" size={32} />
                                            </div>
                                        ) : filteredPosts.length === 0 ? (
                                            <div className="text-center py-12 bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl">
                                                <p className="text-muted mb-4">No posts yet</p>
                                                <p className="text-sm text-muted mb-6">Start following buddies or explore recommendations</p>
                                            </div>
                                        ) : (
                                            <>
                                                {filteredPosts.map((post, index) => (
                                                    post.content_type === 'trip' ? (
                                                        <TripFeedCard 
                                                            key={`trip-${post.id}-${index}`} 
                                                            trip={post as unknown as Trip}
                                                        />
                                                    ) : (
                                                        <FeedPostCard 
                                                            key={`rec-${post.id}-${index}`} 
                                                            post={post} 
                                                            onUpdate={updatePost}
                                                            onRemove={removePost}
                                                        />
                                                    )
                                                ))}
                                                
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
                                </div>
                            )}
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
                        <div className="space-y-6 sticky top-5 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 animate-in fade-in slide-in-from-left-8 duration-500">
                            <YourStatsCard stats={stats} />
                            {/* Category Filters */}
                            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 shadow-lg">
                                <h3 className="font-semibold text-primary mb-3">Filter by Category</h3>
                                <CategoryFilter 
                                    selectedInterest={selectedInterest}
                                    onSelectInterest={setSelectedInterest}
                                />
                            </div>
                        </div>

                        {/* Center Feed */}
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150">
                            {/* Tab Navigation */}
                            <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-3 sticky top-20 z-10 shadow-lg">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setActiveTab('top-places')}
                                        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                                            activeTab === 'top-places'
                                                ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                        }`}
                                    >
                                        <TrendingUp size={18} />
                                        <span>Top Places This Month</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('friends-updates')}
                                        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                                            activeTab === 'friends-updates'
                                                ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                        }`}
                                    >
                                        <Users size={18} />
                                        <span>Friends' Updates</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('feed')}
                                        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                                            activeTab === 'feed'
                                                ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                        }`}
                                    >
                                        <span>Your Feed</span>
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <section className="space-y-6">
                                {activeTab === 'top-places' && (
                                    <FeedSection
                                        title=""
                                        icon={TrendingUp}
                                        posts={filteredTopPlaces}
                                        loading={loadingTopPlaces}
                                        emptyMessage={selectedInterest 
                                            ? `No ${selectedInterest} places trending this month yet.`
                                            : "No trending places this month yet. Be the first to add a recommendation!"
                                        }
                                        onUpdate={updatePost}
                                        onRemove={removePost}
                                    />
                                )}

                                {activeTab === 'friends-updates' && (
                                    <FeedSection
                                        title=""
                                        icon={Users}
                                        posts={filteredBuddiesActivity}
                                        loading={loadingBuddiesActivity}
                                        emptyMessage={selectedInterest
                                            ? `No ${selectedInterest} updates from your travel buddies yet.`
                                            : "No updates from your travel buddies yet. Connect with more travelers to see their activity!"
                                        }
                                        onUpdate={updatePost}
                                        onRemove={removePost}
                                    />
                                )}

                                {activeTab === 'feed' && (
                                    <>
                                        {/* Main Feed Header */}
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-semibold text-primary">
                                                {selectedInterest ? `${selectedInterest} Feed` : 'Your Feed'}
                                            </h2>
                                            <button 
                                                onClick={refresh}
                                                className="flex items-center gap-2 text-sm text-pulse hover:text-pulse/80 transition-all hover:scale-105 active:scale-95"
                                            >
                                                <RefreshCw size={16} className={feedLoading ? 'animate-spin' : ''} />
                                                <span>Refresh</span>
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
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-4">
                                                    {filteredPosts.map((post, index) => (
                                                        post.content_type === 'trip' ? (
                                                            <TripFeedCard 
                                                                key={`trip-${post.id}-${index}`} 
                                                                trip={post as unknown as Trip}
                                                            />
                                                        ) : (
                                                            <FeedPostCard 
                                                                key={`rec-${post.id}-${index}`} 
                                                                post={post} 
                                                                onUpdate={updatePost}
                                                                onRemove={removePost}
                                                            />
                                                        )
                                                    ))}
                                                </div>
                                                
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
                                    </>
                                )}
                            </section>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 animate-in fade-in slide-in-from-right-8 duration-500 delay-300">
                            <QuickActionsAndLinksCard />
                            <ActiveBuddiesCard buddies={buddies} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

