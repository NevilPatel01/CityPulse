import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useSafeToast } from '../hooks/useSafeToast';
import {
  getBuddies,
  getReceivedBuddyRequests,
  getSentBuddyRequests,
  acceptBuddyRequest,
  declineBuddyRequest,
  cancelBuddyRequest,
  removeBuddy,
  getBlockedUsers,
  unblockUser,
  sendBuddyRequest,
  type Buddy,
  type BuddyRequest,
  type BlockedUser
} from '../services/buddyService';
import { apiRequest, buildApiUrl } from '../config/api';

type TabType = 'buddies' | 'received' | 'sent' | 'blocked' | 'find';

interface User {
  id: number;
  username: string;
  full_name: string;
  bio?: string;
  current_location?: string;
  profile_photo_url?: string;
}

export default function BuddiesPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useSafeToast();
  useAuthGuard({ requireAuth: true });

  const [activeTab, setActiveTab] = useState<TabType>('buddies');
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<BuddyRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<BuddyRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'buddies') {
        const response = await getBuddies();
        setBuddies(response.data.buddies);
      } else if (activeTab === 'received') {
        const response = await getReceivedBuddyRequests();
        setReceivedRequests(response.data.requests);
      } else if (activeTab === 'sent') {
        const response = await getSentBuddyRequests();
        setSentRequests(response.data.requests);
      } else if (activeTab === 'blocked') {
        const response = await getBlockedUsers();
        setBlockedUsers(response.data.blockedUsers);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await apiRequest<{ success: boolean; data: { users: User[] } }>(
        buildApiUrl(`api/search/users?query=${encodeURIComponent(searchQuery)}`),
        { method: 'GET' }
      );
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Search error:', error);
      showError('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptBuddyRequest(requestId);
      showSuccess('Success', 'Buddy request accepted');
      loadData();
    } catch {
      showError('Error', 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      await declineBuddyRequest(requestId);
      showSuccess('Success', 'Buddy request declined');
      loadData();
    } catch {
      showError('Error', 'Failed to decline request');
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await cancelBuddyRequest(requestId);
      showSuccess('Success', 'Buddy request cancelled');
      loadData();
    } catch {
      showError('Error', 'Failed to cancel request');
    }
  };

  const handleRemoveBuddy = async (buddyId: number) => {
    if (!confirm('Are you sure you want to remove this buddy?')) return;
    
    try {
      await removeBuddy(buddyId);
      showSuccess('Success', 'Buddy removed');
      loadData();
    } catch {
      showError('Error', 'Failed to remove buddy');
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      await unblockUser(userId);
      showSuccess('Success', 'User unblocked');
      loadData();
    } catch {
      showError('Error', 'Failed to unblock user');
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await sendBuddyRequest(userId);
      showSuccess('Success', 'Buddy request sent');
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      const error = err as Error;
      showError('Error', error.message || 'Failed to send request');
    }
  };

  const renderBuddiesList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {buddies.map((buddy) => (
        <Card key={buddy.id} className="bg-surface-glass border-subtle">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <img
                src={buddy.profile_photo_url || '/default-avatar.png'}
                alt={buddy.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-primary font-semibold truncate">{buddy.full_name}</h3>
                <p className="text-muted text-sm">@{buddy.username}</p>
                {buddy.current_location && (
                  <p className="text-muted text-xs mt-1">{buddy.current_location}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/profile/${buddy.username}`)}
                    className="text-xs"
                  >
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveBuddy(buddy.id)}
                    className="text-xs text-error border-error hover:bg-error hover:text-white"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderReceivedRequests = () => (
    <div className="space-y-4">
      {receivedRequests.map((request) => (
        <Card key={request.id} className="bg-surface-glass border-subtle">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <img
                src={request.profile_photo_url || '/default-avatar.png'}
                alt={request.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-primary font-semibold">{request.full_name}</h3>
                <p className="text-muted text-sm">@{request.username}</p>
                {request.request_message && (
                  <p className="text-muted text-sm mt-2 p-2 bg-base rounded">
                    {request.request_message}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id)}
                    className="bg-success hover:bg-success/80"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineRequest(request.id)}
                    className="border-error text-error hover:bg-error hover:text-white"
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/profile/${request.username}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSentRequests = () => (
    <div className="space-y-4">
      {sentRequests.map((request) => (
        <Card key={request.id} className="bg-surface-glass border-subtle">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <img
                src={request.profile_photo_url || '/default-avatar.png'}
                alt={request.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-primary font-semibold">{request.full_name}</h3>
                <p className="text-muted text-sm">@{request.username}</p>
                <p className="text-muted text-xs mt-1">Pending...</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelRequest(request.id)}
                    className="border-error text-error hover:bg-error hover:text-white"
                  >
                    Cancel Request
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/profile/${request.username}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderBlockedUsers = () => (
    <div className="space-y-4">
      {blockedUsers.map((user) => (
        <Card key={user.id} className="bg-surface-glass border-subtle">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <img
                src={user.profile_photo_url || '/default-avatar.png'}
                alt={user.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-primary font-semibold">{user.full_name}</h3>
                <p className="text-muted text-sm">@{user.username}</p>
                <p className="text-muted text-xs mt-1">
                  Blocked on {new Date(user.blocked_at).toLocaleDateString()}
                </p>
                <Button
                  size="sm"
                  onClick={() => handleUnblock(user.id)}
                  className="mt-3 bg-success hover:bg-success/80"
                >
                  Unblock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFindBuddies = () => (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name or username..."
          className="flex-1 px-4 py-2 bg-surface-glass border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((user) => (
            <Card key={user.id} className="bg-surface-glass border-subtle">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={user.profile_photo_url || '/default-avatar.png'}
                    alt={user.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-primary font-semibold">{user.full_name}</h3>
                    <p className="text-muted text-sm">@{user.username}</p>
                    {user.bio && (
                      <p className="text-muted text-sm mt-2 line-clamp-2">{user.bio}</p>
                    )}
                    {user.current_location && (
                      <p className="text-muted text-xs mt-1">{user.current_location}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(user.id)}
                        className="bg-pulse hover:bg-pulse/80"
                      >
                        Send Request
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/profile/${user.username}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 rounded-full bg-surface-glass flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <p className="text-muted text-center">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-base">
      <Header />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-primary mb-8">Travel Buddies</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-subtle pb-2">
              <button
                onClick={() => setActiveTab('buddies')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === 'buddies'
                    ? 'bg-pulse text-white'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                My Buddies {buddies.length > 0 && `(${buddies.length})`}
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === 'received'
                    ? 'bg-pulse text-white'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                Requests {receivedRequests.length > 0 && `(${receivedRequests.length})`}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-pulse text-white'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
              </button>
              <button
                onClick={() => setActiveTab('find')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === 'find'
                    ? 'bg-pulse text-white'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                Find Buddies
              </button>
              <button
                onClick={() => setActiveTab('blocked')}
                className={`px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === 'blocked'
                    ? 'bg-pulse text-white'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                Blocked
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse"></div>
              </div>
            ) : (
              <>
                {activeTab === 'buddies' && (
                  buddies.length === 0 ? renderEmptyState('No buddies yet. Find some travel companions!') : renderBuddiesList()
                )}
                {activeTab === 'received' && (
                  receivedRequests.length === 0 ? renderEmptyState('No pending requests') : renderReceivedRequests()
                )}
                {activeTab === 'sent' && (
                  sentRequests.length === 0 ? renderEmptyState('No sent requests') : renderSentRequests()
                )}
                {activeTab === 'blocked' && (
                  blockedUsers.length === 0 ? renderEmptyState('No blocked users') : renderBlockedUsers()
                )}
                {activeTab === 'find' && renderFindBuddies()}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
