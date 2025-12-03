import { useState, useEffect, useCallback } from 'react';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useToast } from '../hooks/useToast';
import { Header } from '../components/layout/Header';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { MobileBackButton } from '../components/layout/MobileBackButton';
import TripCard from '../components/trips/TripCard';
import TripForm from '../components/trips/TripForm';
import tripService from '../services/tripService';
import type { Trip, CreateTripData } from '../types/trip';
import { Plus, Loader2, MapPin, Calendar, Filter, ChevronDown } from 'lucide-react';

const TripsPage = () => {
  useAuthGuard();
  const { showSuccess, showError } = useToast();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Load trips on mount
  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'all' ? { status: statusFilter as 'planning' | 'active' | 'completed' | 'cancelled' } : undefined;
      const data = await tripService.getUserTrips(filters);
      setTrips(data);
    } catch (error) {
      console.error('Failed to load trips:', error);
      showError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showError]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleCreateTrip = async (data: CreateTripData) => {
    try {
      setIsCreating(true);
      if (editingTrip) {
        // Update existing trip
        const updated = await tripService.updateTrip(editingTrip.id, data);
        setTrips(trips.map(t => t.id === updated.id ? updated : t));
        showSuccess('Trip updated successfully!');
      } else {
        // Create new trip
        const newTrip = await tripService.createTrip(data);
        setTrips([newTrip, ...trips]);
        showSuccess('Trip created successfully!');
      }
      setShowForm(false);
      setEditingTrip(undefined);
    } catch (error) {
      console.error('Failed to save trip:', error);
      showError(error instanceof Error ? error.message : 'Failed to save trip');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTrip = async (tripId: number) => {
    try {
      await tripService.deleteTrip(tripId);
      setTrips(trips.filter(t => t.id !== tripId));
      showSuccess('Trip deleted successfully');
    } catch (error) {
      console.error('Failed to delete trip:', error);
      showError('Failed to delete trip');
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setShowForm(true);
  };

  const groupedTrips = {
    planning: trips.filter(t => t.status === 'planning'),
    active: trips.filter(t => t.status === 'active'),
    completed: trips.filter(t => t.status === 'completed'),
  };

  const statsData = [
    { label: 'Planning', count: groupedTrips.planning.length, color: 'text-[var(--pulse)]' },
    { label: 'Active', count: groupedTrips.active.length, color: 'text-[var(--accent-teal)]' },
    { label: 'Completed', count: groupedTrips.completed.length, color: 'text-[var(--success)]' },
  ];

  return (
    <div className="min-h-screen bg-[var(--base)] pb-20">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Mobile Back Button */}
        <MobileBackButton fallbackPath="/explore" />

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">My Trips</h1>
            <p className="text-[var(--text-muted)]">Plan and manage your travel adventures</p>
          </div>
          <button
            onClick={() => {
              setEditingTrip(undefined);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--pulse)] text-white rounded-lg hover:bg-[var(--pulse)]/90 transition-colors font-medium shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Trip
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsData.map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--surface-glass)] backdrop-blur-sm border border-[var(--border-subtle)] rounded-xl p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
                </div>
                <div className={`p-3 rounded-lg bg-current/10 ${stat.color}`}>
                  {stat.label === 'Planning' && <Calendar className="w-6 h-6" />}
                  {stat.label === 'Active' && <MapPin className="w-6 h-6" />}
                  {stat.label === 'Completed' && <Calendar className="w-6 h-6" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters - Mobile Dropdown */}
        <div className="md:hidden relative">
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="flex items-center justify-between w-full px-4 py-3 bg-[var(--base)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="font-medium">
                {statusFilter === 'all' ? 'All Trips' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${showMobileFilter ? 'rotate-180' : ''}`} />
          </button>
          {showMobileFilter && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--base)] border border-[var(--border-subtle)] rounded-lg shadow-lg z-20 overflow-hidden">
              {['all', 'planning', 'active', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowMobileFilter(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    statusFilter === status
                      ? 'bg-[var(--pulse)] text-white'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  {status === 'all' ? 'All Trips' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters - Desktop Pills */}
        <div className="hidden md:flex items-center gap-3 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          {['all', 'planning', 'active', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[var(--pulse)] text-white'
                  : 'bg-[var(--surface-glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Trips Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pulse)]" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              No trips yet
            </h3>
            <p className="text-[var(--text-muted)] mb-6">
              Start planning your next adventure!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-[var(--pulse)] text-white rounded-lg hover:bg-[var(--pulse)]/90 transition-colors font-medium"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEdit={handleEditTrip}
                onDelete={handleDeleteTrip}
                showActions={true}
              />
            ))}
          </div>
        )}
      </main>

      {/* Trip Form Modal */}
      {showForm && (
        <TripForm
          trip={editingTrip}
          onSubmit={handleCreateTrip}
          onCancel={() => {
            setShowForm(false);
            setEditingTrip(undefined);
          }}
          isLoading={isCreating}
        />
      )}

      <BottomNavigation />
    </div>
  );
};

export default TripsPage;
