import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Search, Globe, Heart } from 'lucide-react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useToast } from '../hooks/useToast';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { tripService } from '../services/tripService';
import type { TravelCompanionMatch, PublicTripDiscover } from '../types/trip';
import '../styles/CompanionFinderPage.css';

const CompanionFinderPage = () => {
  useAuthGuard();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<'find' | 'discover'>('find');
  const [loading, setLoading] = useState(false);
  
  // Find Companions State
  const [companions, setCompanions] = useState<TravelCompanionMatch[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Discover Trips State
  const [trips, setTrips] = useState<PublicTripDiscover[]>([]);
  const [discoverCityFilter, setDiscoverCityFilter] = useState('');
  const [discoverDateFilter, setDiscoverDateFilter] = useState('');

  const loadCompanions = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (cityFilter) filters.city_name = cityFilter;
      if (startDateFilter) filters.start_date = startDateFilter;
      if (endDateFilter) filters.end_date = endDateFilter;
      
      const data = await tripService.findTravelCompanions(filters);
      setCompanions(data);
    } catch (error) {
      showError('Failed to load companions');
      console.error('Error loading companions:', error);
    } finally {
      setLoading(false);
    }
  }, [cityFilter, startDateFilter, endDateFilter, showError]);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (discoverCityFilter) filters.city_name = discoverCityFilter;
      if (discoverDateFilter) filters.start_date = discoverDateFilter;
      
      const response = await tripService.discoverPublicTrips(filters);
      setTrips(response.data || response);
    } catch (error) {
      showError('Failed to load trips');
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  }, [discoverCityFilter, discoverDateFilter, showError]);

  useEffect(() => {
    if (activeTab === 'find') {
      loadCompanions();
    } else {
      loadTrips();
    }
  }, [activeTab, loadCompanions, loadTrips]);

  const handleInvite = async (tripId: number, userId: number) => {
    try {
      await tripService.inviteCompanion(tripId, userId);
      showSuccess('Invitation sent!');
      loadCompanions();
    } catch (error) {
      showError('Failed to send invitation');
      console.error('Error inviting companion:', error);
    }
  };

  const handleClearFilters = () => {
    if (activeTab === 'find') {
      setCityFilter('');
      setStartDateFilter('');
      setEndDateFilter('');
    } else {
      setDiscoverCityFilter('');
      setDiscoverDateFilter('');
    }
  };

  const getBuddyStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const classes: Record<string, string> = {
      accepted: 'badge-success',
      pending: 'badge-warning',
      declined: 'badge-error',
    };
    
    return (
      <span className={`buddy-badge ${classes[status] || ''}`}>
        {status === 'accepted' ? '🤝 Buddy' : status === 'pending' ? '⏳ Pending' : '❌ Declined'}
      </span>
    );
  };

  return (
    <div className="companion-finder-page">
      <Header />
      
      <div className="finder-content">
        <div className="finder-header">
          <h1>Travel Companion Finder</h1>
          <p className="subtitle">Find travel buddies and discover exciting trips</p>
        </div>

        {/* Tabs */}
        <div className="finder-tabs">
          <button
            className={`tab ${activeTab === 'find' ? 'active' : ''}`}
            onClick={() => setActiveTab('find')}
          >
            <Users className="tab-icon" />
            Find Companions
          </button>
          <button
            className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <Globe className="tab-icon" />
            Discover Trips
          </button>
        </div>

        {/* Find Companions Tab */}
        {activeTab === 'find' && (
          <div className="tab-content">
            {/* Filters */}
            <div className="filters-section">
              <h3>Search Filters</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>
                    <MapPin className="input-icon" />
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Paris, Tokyo..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                </div>
                
                <div className="filter-group">
                  <label>
                    <Calendar className="input-icon" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>
                
                <div className="filter-group">
                  <label>
                    <Calendar className="input-icon" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="filter-actions">
                <button onClick={loadCompanions} className="btn-primary" disabled={loading}>
                  <Search className="btn-icon" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button onClick={handleClearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="results-section">
              <h3>
                {companions.length} {companions.length === 1 ? 'Match' : 'Matches'} Found
              </h3>
              
              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Finding travel companions...</p>
                </div>
              ) : companions.length > 0 ? (
                <div className="companions-grid">
                  {companions.map((match) => (
                    <div key={`${match.id}-${match.trip_id}`} className="companion-card">
                      <div className="card-header">
                        <img
                          src={match.profile_photo_url || '/default-avatar.png'}
                          alt={match.username}
                          className="avatar"
                        />
                        <div className="user-info">
                          <h4>{match.full_name || match.username}</h4>
                          <p className="username">@{match.username}</p>
                          {getBuddyStatusBadge(match.buddy_status)}
                        </div>
                      </div>

                      <div className="trip-info">
                        <h5 className="trip-title">
                          <Heart className="icon-small" />
                          {match.trip_title}
                        </h5>
                        
                        <div className="trip-details">
                          <div className="detail-item">
                            <Calendar className="icon-small" />
                            <span>
                              {new Date(match.start_date).toLocaleDateString()} - {new Date(match.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="detail-item">
                            <MapPin className="icon-small" />
                            <span>
                              {match.cities.slice(0, 2).map(c => c.name).join(', ')}
                              {match.cities.length > 2 && ` +${match.cities.length - 2} more`}
                            </span>
                          </div>
                          
                          <div className="detail-item">
                            <Users className="icon-small" />
                            <span>{match.companions_count} {match.companions_count === 1 ? 'companion' : 'companions'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          onClick={() => navigate(`/trips/${match.trip_id}`)}
                          className="btn-secondary"
                        >
                          View Trip
                        </button>
                        
                        {match.trip_companion_status === 'invited' ? (
                          <span className="status-badge invited">Already Invited</span>
                        ) : match.trip_companion_status === 'accepted' ? (
                          <span className="status-badge accepted">Joined</span>
                        ) : (
                          <button
                            onClick={() => handleInvite(match.trip_id, match.id)}
                            className="btn-primary"
                          >
                            Request to Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Users className="empty-icon" />
                  <p>No travel companions found</p>
                  <p className="hint">Try adjusting your filters or create a public trip to find companions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discover Trips Tab */}
        {activeTab === 'discover' && (
          <div className="tab-content">
            {/* Filters */}
            <div className="filters-section">
              <h3>Search Filters</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>
                    <MapPin className="input-icon" />
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Paris, Tokyo..."
                    value={discoverCityFilter}
                    onChange={(e) => setDiscoverCityFilter(e.target.value)}
                  />
                </div>
                
                <div className="filter-group">
                  <label>
                    <Calendar className="input-icon" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={discoverDateFilter}
                    onChange={(e) => setDiscoverDateFilter(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="filter-actions">
                <button onClick={loadTrips} className="btn-primary" disabled={loading}>
                  <Search className="btn-icon" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button onClick={handleClearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="results-section">
              <h3>
                {trips.length} Public {trips.length === 1 ? 'Trip' : 'Trips'}
              </h3>
              
              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Discovering trips...</p>
                </div>
              ) : trips.length > 0 ? (
                <div className="trips-grid">
                  {trips.map((trip) => (
                    <div key={trip.id} className="trip-discover-card" onClick={() => navigate(`/trips/${trip.id}`)}>
                      {trip.cover_image_url || trip.cover_photo_url ? (
                        <img
                          src={trip.cover_image_url || trip.cover_photo_url}
                          alt={trip.title}
                          className="trip-cover"
                        />
                      ) : (
                        <div className="trip-cover-placeholder">
                          <Globe className="placeholder-icon" />
                        </div>
                      )}
                      
                      <div className="trip-card-content">
                        <h4>{trip.title}</h4>
                        <p className="trip-description">{trip.description}</p>
                        
                        <div className="trip-meta">
                          <span className="meta-item">
                            <Calendar className="icon-small" />
                            {new Date(trip.start_date).toLocaleDateString()}
                          </span>
                          
                          <span className="meta-item">
                            <Users className="icon-small" />
                            {trip.companions_count || 0} companions
                          </span>
                        </div>

                        {trip.highlights && trip.highlights.length > 0 && (
                          <div className="highlights">
                            {trip.highlights.slice(0, 3).map((highlight) => (
                              <div key={highlight.id} className="highlight-chip">
                                {highlight.photo_url && (
                                  <img src={highlight.photo_url} alt={highlight.title} className="highlight-thumb" />
                                )}
                                <span>{highlight.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="trip-creator">
                          <img
                            src={trip.creator_photo || '/default-avatar.png'}
                            alt={trip.creator_username}
                            className="creator-avatar"
                          />
                          <span>by @{trip.creator_username}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Globe className="empty-icon" />
                  <p>No public trips found</p>
                  <p className="hint">Try adjusting your filters or check back later</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CompanionFinderPage;
