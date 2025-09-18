import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../context/AuthContext';

// Types
interface RecommendationCardProps {
    title: string;
    location: string;
    rating: number;
    category: string;
    image: string;
}

// Dashboard Components
const DashboardHeader = ({ user, onLogout }: { user: User | null; onLogout: () => void }) => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-base border-b border-subtle">
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pulse rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CP</span>
                </div>
                <span className="text-primary font-semibold">CityPulse</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-pulse rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                        {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                </div>
                <button
                    onClick={onLogout}
                    className="text-muted hover:text-primary text-sm"
                >
                    Logout
                </button>
            </div>
        </div>
    </header>
);

const QuickActionsCard = () => (
    <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-primary">Quick Actions</h3>
        <button className="w-full bg-pulse text-white py-2 px-4 rounded-lg text-sm font-medium">
            Add Recommendation
        </button>
        <button className="w-full bg-white/10 text-primary py-2 px-4 rounded-lg text-sm font-medium border border-white/20">
            Find Buddy
        </button>
    </div>
);

const YourStatsCard = () => {
    const stats = [
        { label: "Recommendations", value: "127" },
        { label: "Cities Visited", value: "23" },
        { label: "Buddies", value: "89" },
    ];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Your Stats</h3>
            <div className="space-y-2">
                {stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
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

const TrendingCard = ({ title, location, rating, category, image }: RecommendationCardProps) => (
    <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl overflow-hidden cursor-pointer hover:bg-white/12 transition-all">
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

const TrendingNowCard = () => {
    const trendingPlaces = [
        { title: "Secret Garden Cafe", location: "East Village", rating: 4.9, category: "Coffee", image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=300&h=200&fit=crop" },
        { title: "Riverside Trail", location: "Williamsburg", rating: 4.8, category: "Hiking", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop" },
    ];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Trending Now</h3>
            <div className="space-y-3">
                {trendingPlaces.map((place, index) => (
                    <TrendingCard key={index} {...place} />
                ))}
            </div>
        </div>
    );
};

const ActiveBuddiesCard = () => {
    const buddies = [
        { name: "Sarah Chen", location: "Brooklyn", initials: "SC", status: "online" },
        { name: "Mike Rodriguez", location: "Manhattan", initials: "MR", status: "recently" },
        { name: "Emma Wilson", location: "Queens", initials: "EW", status: "online" },
        { name: "Alex Kim", location: "SoHo", initials: "AK", status: "recently" },
    ];

    return (
        <div className="bg-surface-glass backdrop-blur-glass border border-subtle rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-primary">Active Buddies</h3>
            <div className="space-y-3">
                {buddies.map((buddy, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-8 h-8 bg-pulse rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">{buddy.initials}</span>
                            </div>
                            {buddy.status === "online" && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border border-base"></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-primary">{buddy.name}</p>
                            <p className="text-xs text-muted">{buddy.location}</p>
                        </div>
                    </div>
                ))}
            </div>
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

// Mobile Bottom Navigation
const BottomNav = () => {
    const navItems = [
        { icon: "🏠", label: "Home", active: true },
        { icon: "🔍", label: "Search", active: false },
        { icon: "➕", label: "Add", active: false },
        { icon: "💬", label: "Chat", active: false },
        { icon: "👤", label: "Profile", active: false },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-base border-t border-subtle px-4 py-2">
            <div className="flex justify-around">
                {navItems.map((item, index) => (
                    <button
                        key={index}
                        className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg ${item.active ? 'text-pulse' : 'text-muted'
                            }`}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-xs">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    // Mock recommendations data
    const recommendations = [
        {
            title: "Artisan Coffee House",
            location: "SoHo, NYC",
            rating: 4.8,
            category: "Coffee",
            image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop"
        },
        {
            title: "Hidden Jazz Club",
            location: "Brooklyn, NY",
            rating: 4.9,
            category: "Music",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop"
        },
        {
            title: "Central Park Trail",
            location: "Manhattan, NY",
            rating: 4.7,
            category: "Hiking",
            image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop"
        },
        {
            title: "Local Food Market",
            location: "Chelsea, NYC",
            rating: 4.6,
            category: "Food",
            image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop"
        },
    ];

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        } else if (!authLoading && isAuthenticated) {
            setIsLoading(false);
        }
    }, [authLoading, isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
            <DashboardHeader user={user} onLogout={handleLogout} />

            {/* Mobile Layout */}
            <div className="lg:hidden">
                <main id="main-content" role="main" className="pb-20 pt-16">
                    <div className="space-y-6 p-4">
                        <QuickActionsCard />
                        <TrendingNowCard />

                        <section>
                            <h2 className="text-lg font-semibold text-primary mb-4">Nearby Recommendations</h2>
                            <div className="space-y-4">
                                {recommendations.map((rec, index) => (
                                    <RecommendationCard key={index} {...rec} />
                                ))}
                            </div>
                        </section>
                    </div>
                </main>
                <BottomNav />
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:block">
                <main id="main-content" role="main" className="pt-16">
                    <div className="grid grid-cols-[280px_1fr_320px] gap-6 container mx-auto px-4 py-6">
                        {/* Left Sidebar */}
                        <div className="space-y-6">
                            <QuickActionsCard />
                            <YourStatsCard />
                            <InterestsCard />
                        </div>

                        {/* Center Feed */}
                        <div className="space-y-6">
                            <section>
                                <h2 className="text-xl font-semibold text-primary mb-6">Your Feed</h2>
                                <div className="space-y-4">
                                    {recommendations.map((rec, index) => (
                                        <RecommendationCard key={index} {...rec} />
                                    ))}
                                </div>
                                <div className="text-center py-8">
                                    <p className="text-muted">Loading more recommendations...</p>
                                </div>
                            </section>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6">
                            <TrendingNowCard />
                            <ActiveBuddiesCard />
                            <QuickLinksCard />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
