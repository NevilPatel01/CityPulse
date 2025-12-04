import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { MobileBackButton } from '../components/layout/MobileBackButton';
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
  sendBuddyRequest,
  type Buddy,
  type BuddyRequest,
} from '../services/buddyService';
import { apiRequest, buildApiUrl } from '../config/api';
import Avatar from '../components/ui/Avatar';

type TabType = 'buddies' | 'requests' | 'discover';

interface User {
  id: number;
  username: string;
  full_name: string;
  bio?: string;
  current_location?: string;
  profile_photo_url?: string;
  mutual_connections?: number;
  buddies_count?: number;
  recommendations_count?: number;
  buddy_status?: 'pending' | 'accepted' | null;
  interests?: Array<{id: number; name: string}>;
}

interface InterestCategory {
  id: number;
  name: string;
  description?: string;
}

interface DiscoverFilters {
  location: string;
  interests: number[];
}

export default function BuddiesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useSafeToast();
  useAuthGuard({ requireAuth: true });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get('tab');
    return (tab === 'requests' || tab === 'discover') ? tab : 'buddies';
  });
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<BuddyRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<BuddyRequest[]>([]);
  const [discoveredUsers, setDiscoveredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [interestCategories, setInterestCategories] = useState<InterestCategory[]>([]);
  const [filters, setFilters] = useState<DiscoverFilters>({
    location: '',
    interests: []
  });
  const [showSendRequestModal, setShowSendRequestModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDiscoverUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.location) params.append('location', filters.location);
      if (filters.interests.length > 0) {
        params.append('interests', filters.interests.join(','));
      }

      const response = await apiRequest<{ success: boolean; data: { users: User[] } }>(
        buildApiUrl(`api/buddies/discover?${params.toString()}`),
        { method: 'GET' }
      );
      setDiscoveredUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
      showError('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters, showError]);

  // Load interest categories
  useEffect(() => {
    const loadInterests = async () => {
      try {
        const response = await apiRequest<{ success: boolean; data: InterestCategory[] }>(
          buildApiUrl('api/recommendations/categories'),
          { method: 'GET' }
        );
        setInterestCategories(response.data);
      } catch (error) {
        console.error('Failed to load interests:', error);
      }
    };
    loadInterests();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Debounced search for discover tab
  useEffect(() => {
    if (activeTab === 'discover') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        loadDiscoverUsers();
      }, 500);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [activeTab, searchQuery, filters, loadDiscoverUsers]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'buddies') {
        const response = await getBuddies();
        setBuddies(response.data.buddies);
      } else if (activeTab === 'requests') {
        const [received, sent] = await Promise.all([
          getReceivedBuddyRequests(),
          getSentBuddyRequests()
        ]);
        setReceivedRequests(received.data.requests);
        setSentRequests(sent.data.requests);
      } else if (activeTab === 'discover') {
        await loadDiscoverUsers();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
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

  const handleOpenSendRequestModal = (userId: number) => {
    setSelectedUserId(userId);
    setRequestMessage('');
    setShowSendRequestModal(true);
  };

  const handleSendRequest = async () => {
    if (!selectedUserId) return;

    try {
      await sendBuddyRequest(selectedUserId, requestMessage);
      showSuccess('Success', 'Buddy request sent');
      setShowSendRequestModal(false);
      setRequestMessage('');
      setSelectedUserId(null);
      
      // Update user status
      setDiscoveredUsers(prev => prev.map(user =>
        user.id === selectedUserId ? { ...user, buddy_status: 'pending' as const } : user
      ));
    } catch (err) {
      const error = err as Error;
      showError('Error', error.message || 'Failed to send request');
    }
  };

  const handleCancelRequestInDiscover = async (userId: number) => {
    try {
      const request = sentRequests.find(r => r.id === userId);
      if (request) {
        await cancelBuddyRequest(request.id);
        showSuccess('Success', 'Buddy request cancelled');
        
        setDiscoveredUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, buddy_status: null } : user
        ));
      }
    } catch (err) {
      const error = err as Error;
      showError('Error', error.message || 'Failed to cancel request');
    }
  };

  const toggleInterest = (interestId: number) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      interests: []
    });
    setSearchQuery('');
  };

  const renderBuddiesList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {buddies.map((buddy) => (
        <Card key={buddy.id} className="bg-surface-glass border-subtle hover:border-pulse/30 transition-colors">
          <CardContent className="p-4">
                  <div className="flex items-start gap-3">
              <Avatar
                src={buddy.profile_photo_url}
                name={buddy.full_name}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-primary font-semibold truncate">{buddy.full_name}</h3>
                <p className="text-muted text-sm">@{buddy.username}</p>
                {buddy.current_location && (
                  <p className="text-muted text-xs mt-1">📍 {buddy.current_location}</p>
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

  const renderRequestsTab = () => (
    <div className="space-y-8">
      {/* Incoming Requests */}
      <div>
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-pulse rounded-full"></span>
          Incoming Requests ({receivedRequests.length})
        </h2>
        {receivedRequests.length === 0 ? (
          <div className="text-center py-8 text-muted">No incoming requests</div>
        ) : (
          <div className="space-y-4">
            {receivedRequests.map((request) => (
              <Card key={request.id} className="bg-surface-glass border-subtle">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="cursor-pointer" onClick={() => navigate(`/profile/${request.username}`)}>
                      <Avatar
                        src={request.profile_photo_url}
                        name={request.full_name}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-primary font-semibold">{request.full_name}</h3>
                          <p className="text-muted text-sm">@{request.username}</p>
                        </div>
                        <p className="text-xs text-muted">{new Date(request.requested_at).toLocaleDateString()}</p>
                      </div>
                      
                      {request.request_message && (
                        <div className="mt-3 p-3 bg-base/50 rounded-lg border border-subtle">
                          <p className="text-sm text-muted">{request.request_message}</p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="h-9 px-3 bg-success hover:bg-success/80 text-white rounded-md font-medium transition-all inline-flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="h-9 px-3 bg-red-500/80 hover:bg-red-500 text-white rounded-md font-medium transition-all inline-flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      <div>
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          Sent Requests ({sentRequests.length})
        </h2>
        {sentRequests.length === 0 ? (
          <div className="text-center py-8 text-muted">No sent requests</div>
        ) : (
          <div className="space-y-4">
            {sentRequests.map((request) => (
              <Card key={request.id} className="bg-surface-glass border-subtle">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="cursor-pointer" onClick={() => navigate(`/profile/${request.username}`)}>
                      <Avatar
                        src={request.profile_photo_url}
                        name={request.full_name}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-primary font-semibold truncate">{request.full_name}</h3>
                      <p className="text-muted text-sm">@{request.username}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                          Pending
                        </span>
                        <p className="text-xs text-muted">{new Date(request.requested_at).toLocaleDateString()}</p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(request.id)}
                        className="mt-3 border-error text-error hover:bg-error hover:text-white text-xs"
                      >
                        Cancel Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDiscoverTab = () => (
    <div className="flex gap-6">
      {/* Filter Sidebar */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block w-64 flex-shrink-0`}>
        <Card className="bg-surface-glass border-subtle sticky top-20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters
              </h3>
              <button onClick={clearFilters} className="text-xs text-pulse hover:text-pulse/80">
                Clear
              </button>
            </div>

            {/* Location Filter */}
            <div className="mb-6">
              <label className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Any Location"
                className="w-full px-3 py-2 bg-base border border-subtle rounded-lg text-primary text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse"
              />
            </div>

            {/* Interests Filter */}
            <div>
              <label className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Interests
              </label>
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {interestCategories && interestCategories.length > 0 ? (
                  interestCategories.map((interest) => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        filters.interests.includes(interest.id)
                          ? 'bg-pulse text-white'
                          : 'bg-surface-glass text-muted hover:bg-pulse/20 hover:text-primary border border-subtle'
                      }`}
                    >
                      {interest.name}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {['Adventure', 'Culture', 'Food', 'Nature', 'Photography', 'Beach', 'City Tours', 'Nightlife'].map((tag) => (
                      <span key={tag} className="px-3 py-1.5 rounded-full text-xs bg-surface-glass text-muted border border-subtle opacity-50">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2 bg-surface-glass border border-subtle rounded-lg text-primary hover:bg-pulse/10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full pl-10 pr-4 py-3 bg-surface-glass border border-subtle rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-pulse"
              />
            </div>
          </div>
          <p className="text-xs text-muted mt-2">
            Connect with fellow travelers • {discoveredUsers.length} users found
          </p>
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse"></div>
          </div>
        ) : discoveredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-surface-glass flex items-center justify-center mb-4 mx-auto">
              <svg className="w-12 h-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-muted">No users found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discoveredUsers.map((user) => (
              <Card 
                key={user.id} 
                className="bg-surface-glass border-subtle hover:border-pulse/30 transition-all cursor-pointer"
                onClick={(e) => {
                  // Only navigate if not clicking on buttons
                  if (!(e.target as HTMLElement).closest('button')) {
                    navigate(`/profile/${user.username}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={user.profile_photo_url}
                      name={user.full_name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-primary font-semibold">{user.full_name}</h3>
                          <p className="text-muted text-sm">📍 {user.current_location || 'Location not set'}</p>
                        </div>
                        {user.mutual_connections && user.mutual_connections > 0 && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30 whitespace-nowrap">
                            🤝 {user.mutual_connections} mutual
                          </span>
                        )}
                      </div>
                      
                      {user.bio && (
                        <p className="text-muted text-sm mb-3 line-clamp-2">{user.bio}</p>
                      )}

                      {user.interests && user.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {user.interests.slice(0, 3).map((interest, idx) => (
                            <span key={idx} className="px-2 py-1 bg-pulse/10 text-pulse text-xs rounded-full border border-pulse/20">
                              {typeof interest === 'object' ? interest.name : interest}
                            </span>
                          ))}
                          {user.interests.length > 3 && (
                            <span className="px-2 py-1 bg-surface-glass text-muted text-xs rounded-full">
                              +{user.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {user.buddy_status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRequestInDiscover(user.id)}
                            className="text-xs border-error text-error hover:bg-error hover:text-white"
                          >
                            Cancel Request
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleOpenSendRequestModal(user.id)}
                            className="bg-pulse hover:bg-pulse/80 text-xs"
                          >
                            Send Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
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
    <div className="min-h-screen bg-base pb-20">
      <Header />
      <MobileBackButton fallbackPath="/explore" />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-primary mb-8">Travel Buddies</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-subtle pb-2">
              <button
                onClick={() => setActiveTab('buddies')}
                className={`px-6 py-3 rounded-t-lg transition-all font-medium ${
                  activeTab === 'buddies'
                    ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                My Buddies
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-3 rounded-t-lg transition-all font-medium relative ${
                  activeTab === 'requests'
                    ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                Requests
                {(receivedRequests.length > 0 || sentRequests.length > 0) && (
                  <span className="absolute -top-1 -right-1 min-w-[1.75rem] h-7 px-2.5 bg-red-600 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-xl ring-2 ring-white z-10">
                    {receivedRequests.length + sentRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-6 py-3 rounded-t-lg transition-all font-medium ${
                  activeTab === 'discover'
                    ? 'bg-pulse text-white shadow-lg shadow-pulse/20'
                    : 'text-muted hover:text-primary hover:bg-surface-glass'
                }`}
              >
                Discover
              </button>
            </div>

            {/* Content */}
            {isLoading && activeTab !== 'discover' ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse"></div>
              </div>
            ) : (
              <>
                {activeTab === 'buddies' && (
                  buddies.length === 0 
                    ? renderEmptyState('No buddies yet. Discover some travel companions!') 
                    : renderBuddiesList()
                )}
                {activeTab === 'requests' && renderRequestsTab()}
                {activeTab === 'discover' && renderDiscoverTab()}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Send Request Modal */}
      {showSendRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-surface border-subtle max-w-md w-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-primary mb-4">Send Buddy Request</h3>
              <p className="text-muted text-sm mb-4">
                Add a personal message to introduce yourself (optional)
              </p>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi! I noticed we both love exploring street food. Would love to connect and share recommendations!"
                className="w-full h-32 px-4 py-3 bg-base border border-subtle rounded-lg text-primary placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-pulse"
                maxLength={500}
              />
              <div className="text-xs text-muted text-right mt-1">
                {requestMessage.length}/500
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => {
                    setShowSendRequestModal(false);
                    setRequestMessage('');
                    setSelectedUserId(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendRequest}
                  className="flex-1 bg-pulse hover:bg-pulse/80"
                >
                  Send Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <BottomNavigation />
    </div>
  );
}
