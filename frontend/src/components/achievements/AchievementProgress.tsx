import React, { useEffect, useState } from 'react';
import type { UserAchievement, AchievementStats } from '../../types/achievement';
import { apiEndpoints, apiRequest } from '../../config/api';
import { BadgeCard } from './BadgeCard';
import { Award, TrendingUp, Target, Trophy } from 'lucide-react';

interface AchievementProgressProps {
    username?: string; // If provided, show user's achievements; otherwise show current user
}

export const AchievementProgress: React.FC<AchievementProgressProps> = ({ username }) => {
    const [achievements, setAchievements] = useState<UserAchievement[]>([]);
    const [stats, setStats] = useState<AchievementStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'in-progress'>('all');

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            const endpoint = username
                ? apiEndpoints.achievements.user(username)
                : apiEndpoints.achievements.myProgress;

            const response = await apiRequest<{
                success: boolean;
                data: {
                    achievements?: UserAchievement[];
                    completed?: UserAchievement[];
                    inProgress?: UserAchievement[];
                    stats?: {
                        totalAchievements: number;
                        completedCount: number;
                        completionRate: number;
                    };
                };
            }>(endpoint);

            if (response.success) {
                if (response.data.achievements) {
                    setAchievements(response.data.achievements);
                } else if (response.data.completed && response.data.inProgress) {
                    setAchievements([...response.data.completed, ...response.data.inProgress]);
                }
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await apiRequest<{
                success: boolean;
                data: AchievementStats;
            }>(apiEndpoints.achievements.myStats);

            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching achievement stats:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchAchievements();
            if (!username) {
                await fetchStats();
            }
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username]);

    const filteredAchievements = achievements.filter(achievement => {
        if (activeTab === 'completed') return achievement.is_completed;
        if (activeTab === 'in-progress') return !achievement.is_completed;
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const completedCount = achievements.filter(a => a.is_completed).length;
    const totalCount = achievements.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            {!username && stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            {/* Public Profile Stats */}
            {username && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Achievement Progress</h3>
                            <p className="text-gray-400">
                                {completedCount} of {totalCount} badges earned ({completionRate}%)
                            </p>
                        </div>
                        <div className="text-right">
                            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                            <span className="text-3xl font-bold text-white">{completedCount}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'all'
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    All ({totalCount})
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'completed'
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Completed ({completedCount})
                </button>
                <button
                    onClick={() => setActiveTab('in-progress')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'in-progress'
                            ? 'text-blue-500 border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    In Progress ({totalCount - completedCount})
                </button>
            </div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAchievements.map((achievement) => (
                    <BadgeCard
                        key={achievement.id}
                        achievement={achievement}
                        showProgress={!achievement.is_completed}
                    />
                ))}
            </div>

            {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                        No {activeTab === 'all' ? '' : activeTab} badges yet
                    </h3>
                    <p className="text-gray-500">
                        {activeTab === 'completed'
                            ? 'Start exploring and earning badges!'
                            : 'Keep exploring to unlock achievements!'}
                    </p>
                </div>
            )}
        </div>
    );
};
