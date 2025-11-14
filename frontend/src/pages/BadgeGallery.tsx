import React, { useEffect, useState } from 'react';
import type { UserAchievement, AchievementStats } from '../types/achievement';
import { apiEndpoints, apiRequest } from '../config/api';
import { BadgeCard } from '../components/achievements/BadgeCard';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';

type FilterType = 'all' | 'completed' | 'in-progress' | 'locked';
type SortType = 'recent' | 'progress' | 'name';

export const BadgeGallery: React.FC = () => {
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [stats, setStats] = useState<AchievementStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [sort, setSort] = useState<SortType>('recent');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadAchievementData();
    }, []);

    const loadAchievementData = async () => {
        try {
            setLoading(true);
            const [achievementsRes, statsRes] = await Promise.all([
                apiRequest<{
                    success: boolean;
                    data: UserAchievement[];
                }>(apiEndpoints.achievements.myProgress),
                apiRequest<{
                    success: boolean;
                    data: AchievementStats;
                }>(apiEndpoints.achievements.myStats),
            ]);

            if (achievementsRes.success) {
                setAchievements(achievementsRes.data);
            }
            if (statsRes.success) {
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredAchievements = () => {
        let filtered = [...achievements];

        // Apply filter
        if (filter === 'completed') {
            filtered = filtered.filter(a => a.is_completed);
        } else if (filter === 'in-progress') {
            filtered = filtered.filter(a => !a.is_completed && a.current_progress > 0);
        } else if (filter === 'locked') {
            filtered = filtered.filter(a => !a.is_completed && a.current_progress === 0);
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                a =>
                    a.name.toLowerCase().includes(query) ||
                    a.description.toLowerCase().includes(query)
            );
        }

        // Apply sort
        if (sort === 'recent') {
            filtered.sort((a, b) => {
                if (a.completed_at && b.completed_at) {
                    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                }
                if (a.completed_at) return -1;
                if (b.completed_at) return 1;
                return b.progress_percentage - a.progress_percentage;
            });
        } else if (sort === 'progress') {
            filtered.sort((a, b) => b.progress_percentage - a.progress_percentage);
        } else if (sort === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        return filtered;
    };

    const filteredAchievements = getFilteredAchievements();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Trophy className="w-10 h-10 text-yellow-500" />
                        Achievement Gallery
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Earn badges by exploring, creating content, and connecting with travelers
                    </p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <Trophy className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{stats.completedCount}</span>
                            </div>
                            <p className="text-blue-100 text-sm">Badges Earned</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <Target className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{stats.totalAchievements}</span>
                            </div>
                            <p className="text-purple-100 text-sm">Total Badges</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{stats.inProgressCount}</span>
                            </div>
                            <p className="text-green-100 text-sm">In Progress</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <Award className="w-8 h-8 opacity-80" />
                                <span className="text-3xl font-bold">{stats.completionRate}%</span>
                            </div>
                            <p className="text-orange-100 text-sm">Completion Rate</p>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Search Badges
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or description..."
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Filter
                            </label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as FilterType)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Badges</option>
                                <option value="completed">Completed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="locked">Locked</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Sort By
                            </label>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortType)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="recent">Recently Earned</option>
                                <option value="progress">Progress</option>
                                <option value="name">Name</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-gray-400 text-sm">
                    Showing {filteredAchievements.length} of {achievements.length} badges
                </div>

                {/* Achievement Grid */}
                {filteredAchievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAchievements.map((achievement) => (
                            <BadgeCard
                                key={achievement.id}
                                achievement={achievement}
                                showProgress={!achievement.is_completed}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            No badges found
                        </h3>
                        <p className="text-gray-500">
                            Try adjusting your filters or search query
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
