import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useFeed } from '../hooks/useFeed';
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
import { Loader2, RefreshCw, TrendingUp, Users, Rss, MapPin, Heart, Camera, Plane, ChevronDown, Zap, Filter } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mobile Quick Actions Dropdown Component
const MobileQuickActionsDropdown = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const actions = [
        { label: 'Add Recommendation', onClick: () => navigate('/create-recommendation'), icon: '📝' },
        { label: 'Find Buddy', onClick: () => navigate('/travel-buddies'), icon: '👥' },
        { label: 'Trip Planning', onClick: () => navigate('/trips'), icon: '✈️' },
        { label: 'Leaderboard', onClick: () => navigate('/leaderboard'), icon: '🏆' },
        { label: 'Settings', onClick: () => navigate('/settings'), icon: '⚙️' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-pulse text-white rounded-xl font-medium text-sm shadow-lg shadow-pulse/20 transition-all hover:bg-pulse/90 active:scale-95"
            >
                <Zap size={16} />
                <span>Actions</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-surface-glass backdrop-blur-lg border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => { action.onClick(); setIsOpen(false); }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-primary hover:bg-white/10 transition-colors text-sm"
                        >
                            <span>{action.icon}</span>
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Mobile Filter Dropdown Component
const MobileFilterDropdown = ({ selectedInterest, onSelectInterest }: { 
    selectedInterest: string | null; 
    onSelectInterest: (interest: string | null) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                    selectedInterest 
                        ? 'bg-accent-teal text-white shadow-lg shadow-accent-teal/20' 
                        : 'bg-white/10 text-primary border border-white/20 hover:bg-white/15'
                }`}
            >
                <Filter size={16} />
                <span>{selectedInterest || 'Filter'}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface-glass backdrop-blur-lg border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-3">
                    <CategoryFilter 
                        selectedInterest={selectedInterest}
                        onSelectInterest={(interest) => { onSelectInterest(interest); setIsOpen(false); }}
                    />
                </div>
            )}
        </div>
    );
};

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
            label: 'Leaderboard',
            onClick: () => navigate('/leaderboard'),
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
                <div className="text-center py-12 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-teal-500/10 border border-subtle rounded-2xl backdrop-blur-sm">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        {Icon ? <Icon className="w-10 h-10 text-white/70" /> : <Camera className="w-10 h-10 text-white/70" />}
                    </div>
                    <div className="space-y-3 px-6">
                        <h3 className="text-lg font-medium text-white/90">Discover Amazing Places</h3>
                        <p className="text-sm text-white/70 max-w-sm mx-auto leading-relaxed">{emptyMessage}</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            <span className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Explore
                            </span>
                            <span className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                Connect
                            </span>
                            <span className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full flex items-center gap-1">
                                <Plane className="w-3 h-3" />
                                Travel
                            </span>
                        </div>
                    </div>
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
    
    // Mobile observer ref
    const mobileObserverRef = useRef<HTMLDivElement>(null);
    // Desktop observer ref
    const desktopObserverRef = useRef<HTMLDivElement>(null);
    
    // Unified infinite scroll observer for both mobile and desktop
    useEffect(() => {
        const loadMoreDebounced = (() => {
            let lastLoad = 0;
            return () => {
                const now = Date.now();
                if (now - lastLoad < 500) return; // 500ms debounce
                if (feedLoading) return;
                lastLoad = now;
                console.log('[InfiniteScroll] Triggering loadMore');
                loadMore();
            };
        })();
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !feedLoading && hasMore) {
                        loadMoreDebounced();
                    }
                });
            },
            { rootMargin: '400px', threshold: 0 }
        );
        
        // Observe both mobile and desktop targets
        if (mobileObserverRef.current) {
            observer.observe(mobileObserverRef.current);
        }
        if (desktopObserverRef.current) {
            observer.observe(desktopObserverRef.current);
        }
        
        return () => observer.disconnect();
    }, [feedLoading, hasMore, loadMore]);

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
        // For trips, hide them when a category is selected since trips don't have categories
        // This ensures trips are filtered out when filtering by category
        return false;
    };

    // Filter and mix posts - keep original order from API (already mixed and sorted by engagement)
    // Only filter out current user's own posts and apply category filter
    const filteredPosts = posts.filter(post => {
        // Filter by category if selected
        if (!filterByCategory(post)) return false;
        
        // Exclude current user's own posts
        if (post.content_type === 'recommendation' && post.username === user?.username) {
            return false;
        }
        if (post.content_type === 'trip' && post.creator_username === user?.username) {
            return false;
        }
        
        return true;
    });

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
                    <div className="space-y-3 p-4">
                        {/* Compact Action Bar with Dropdowns */}
                        <div className="flex items-center gap-2 justify-between">
                            <MobileQuickActionsDropdown />
                            <MobileFilterDropdown 
                                selectedInterest={selectedInterest}
                                onSelectInterest={setSelectedInterest}
                            />
                        </div>

                        {/* Tab Navigation */}
                        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-2 sticky top-16 z-10 shadow-lg">
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
                                    <span className="hidden sm:inline">Top Places This Month</span>
                                    <span className="sm:hidden">Top</span>
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
                                    <span className="hidden sm:inline">Friends' Updates</span>
                                    <span className="sm:hidden">Friends</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('feed')}
                                    className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-300 flex items-center gap-2 ${
                                        activeTab === 'feed'
                                            ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                            : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                    }`}
                                >
                                    <Rss size={16} />
                                    <span className="hidden sm:inline">Your Feed</span>
                                    <span className="sm:hidden">Feed</span>
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
                                                
                                                {/* Mobile Infinite scroll trigger */}
                                                <div ref={mobileObserverRef} className="py-4 text-center min-h-[80px]">
                                                    {feedLoading && !selectedInterest ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Loader2 className="animate-spin text-pulse" size={24} />
                                                            <span className="text-muted text-sm">Loading more...</span>
                                                        </div>
                                                    ) : (
                                                        /* Load More button as fallback */
                                                        <button
                                                            onClick={loadMore}
                                                            disabled={feedLoading}
                                                            className="px-6 py-2 bg-pulse/20 hover:bg-pulse/30 text-pulse rounded-full text-sm font-medium transition-all"
                                                        >
                                                            Load More
                                                        </button>
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
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                                    <button
                                        onClick={() => setActiveTab('top-places')}
                                        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                                            activeTab === 'top-places'
                                                ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                        }`}
                                    >
                                        <TrendingUp size={18} />
                                        <span className="hidden lg:inline">Top Places This Month</span>
                                        <span className="lg:hidden">Top</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('friends-updates')}
                                        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                                            activeTab === 'friends-updates'
                                                ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                        }`}
                                    >
                                        <Users size={18} />
                                        <span className="hidden lg:inline">Friends' Updates</span>
                                        <span className="lg:hidden">Friends</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('feed')}
                                        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                                            activeTab === 'feed'
                                                ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                                                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-primary'
                                        }`}
                                    >
                                        <Rss size={18} />
                                        <span className="hidden lg:inline">Your Feed</span>
                                        <span className="lg:hidden">Feed</span>
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
                                            <div className="text-center py-16 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-teal-500/10 border border-subtle rounded-2xl backdrop-blur-sm">
                                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                                    <Rss className="w-12 h-12 text-white/70" />
                                                </div>
                                                <div className="space-y-4 px-6">
                                                    <h3 className="text-xl font-semibold text-white/90">Your Feed is Empty</h3>
                                                    <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                                                        Start following travel buddies or explore amazing recommendations to see personalized content here
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 justify-center mt-6">
                                                        <span className="px-4 py-2 bg-white/10 text-white/80 text-sm rounded-full flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            Find Buddies
                                                        </span>
                                                        <span className="px-4 py-2 bg-white/10 text-white/80 text-sm rounded-full flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            Explore Places
                                                        </span>
                                                        <span className="px-4 py-2 bg-white/10 text-white/80 text-sm rounded-full flex items-center gap-2">
                                                            <Heart className="w-4 h-4" />
                                                            Like Content
                                                        </span>
                                                    </div>
                                                </div>
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
                                                
                                                {/* Desktop Infinite scroll trigger */}
                                                <div ref={desktopObserverRef} className="py-8 text-center min-h-[80px]">
                                                    {feedLoading && !selectedInterest ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Loader2 className="animate-spin text-pulse" size={24} />
                                                            <span className="text-muted">Loading more posts...</span>
                                                        </div>
                                                    ) : (
                                                        /* Load More button as fallback */
                                                        <button
                                                            onClick={loadMore}
                                                            disabled={feedLoading}
                                                            className="px-8 py-3 bg-pulse/20 hover:bg-pulse/30 text-pulse rounded-full text-sm font-medium transition-all hover:scale-105"
                                                        >
                                                            Load More Posts
                                                        </button>
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

