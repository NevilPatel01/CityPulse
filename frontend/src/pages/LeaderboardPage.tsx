import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useToast } from '../hooks/useToast';
import { getLeaderboard, getMyLeaderboardPosition, type LeaderboardEntry } from '../services/leaderboardService';
import Avatar from '../components/ui/Avatar';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';

type LeaderboardType = 'all' | 'achievements' | 'points' | 'badges';

export default function LeaderboardPage() {
  useAuthGuard();
  const navigate = useNavigate();
  const { showError } = useToast();
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myPosition, setMyPosition] = useState<{ rank: number; achievements_count: number; total_points: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<LeaderboardType>('all');

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLeaderboard(type, 20);
      if (response.success) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      showError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [type, showError]);

  const loadMyPosition = useCallback(async () => {
    try {
      const response = await getMyLeaderboardPosition();
      if (response.success) {
        setMyPosition(response.data);
      }
    } catch (error) {
      console.error('Failed to load my position:', error);
      // Silently fail - not critical
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    loadMyPosition();
  }, [loadLeaderboard, loadMyPosition]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
    } else if (rank === 3) {
      return <Award className="w-6 h-6 text-amber-600 fill-amber-600" />;
    }
    return <span className="w-6 h-6 flex items-center justify-center text-muted font-semibold">{rank}</span>;
  };

  const getTypeLabel = (type: LeaderboardType) => {
    switch (type) {
      case 'achievements':
        return 'Most Achievements';
      case 'points':
        return 'Highest Points';
      case 'badges':
        return 'Most Badges';
      default:
        return 'Overall Leaderboard';
    }
  };

  return (
    <div className="min-h-screen bg-base">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-pulse" />
              Leaderboard
            </h1>
            <p className="text-muted">
              Top users by achievements and contributions
            </p>
          </div>

          {/* My Position Card */}
          {myPosition && (
            <div className="bg-pulse/10 border border-pulse/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">Your Position</p>
                  <p className="text-2xl font-bold text-primary">
                    #{myPosition.rank}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">{myPosition.achievements_count} Achievements</p>
                  <p className="text-sm text-muted">{myPosition.total_points} Points</p>
                </div>
              </div>
            </div>
          )}

          {/* Type Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(['all', 'achievements', 'points', 'badges'] as LeaderboardType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setType(filterType)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  type === filterType
                    ? 'bg-pulse text-white'
                    : 'bg-surface-glass text-primary border border-subtle hover:bg-surface-glass/80'
                }`}
              >
                {getTypeLabel(filterType)}
              </button>
            ))}
          </div>

          {/* Leaderboard List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-pulse" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20 bg-surface-glass rounded-xl border border-subtle">
              <Trophy className="w-16 h-16 mx-auto text-muted mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">No rankings yet</h3>
              <p className="text-muted">Be the first to earn achievements and climb the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`bg-surface-glass backdrop-blur-glass border rounded-xl p-4 hover:border-pulse/30 transition-all cursor-pointer ${
                    entry.rank <= 3 ? 'border-pulse/50 shadow-lg shadow-pulse/10' : 'border-subtle'
                  }`}
                  onClick={() => navigate(`/profile/${entry.username}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/profile/${entry.username}`);
                    }
                  }}
                  aria-label={`View ${entry.full_name}'s profile (Rank ${entry.rank})`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar
                        src={entry.profile_photo_url}
                        name={entry.full_name}
                        size="md"
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary truncate">
                        {entry.full_name}
                      </h3>
                      <p className="text-sm text-muted truncate">@{entry.username}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted">Achievements</p>
                          <p className="font-semibold text-primary">{entry.achievements_count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted">Points</p>
                          <p className="font-semibold text-primary">{entry.total_points}</p>
                        </div>
                        {entry.unique_badges !== undefined && (
                          <div>
                            <p className="text-sm text-muted">Badges</p>
                            <p className="font-semibold text-primary">{entry.unique_badges}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}

