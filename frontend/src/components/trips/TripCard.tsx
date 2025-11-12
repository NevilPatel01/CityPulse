import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Globe, Lock } from 'lucide-react';
import type { Trip } from '../../types/trip';

interface TripCardProps {
  trip: Trip;
  onEdit?: (trip: Trip) => void;
  onDelete?: (tripId: number) => void;
  showActions?: boolean;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onEdit, onDelete, showActions = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[var(--success)]';
      case 'active':
        return 'bg-[var(--accent-teal)]';
      case 'planning':
        return 'bg-[var(--pulse)]';
      case 'cancelled':
        return 'bg-[var(--error)]';
      default:
        return 'bg-[var(--text-muted)]';
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'buddies_only':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="group relative bg-[var(--surface-glass)] backdrop-blur-sm rounded-xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--pulse)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--pulse)]/20">
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--pulse)]/20 to-[var(--accent-teal)]/20">
        {trip.cover_photo_url ? (
          <img
            src={trip.cover_photo_url}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-16 h-16 text-[var(--text-muted)]" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(trip.status)}`}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </span>
        </div>

        {/* Privacy Icon */}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm p-2 rounded-lg text-white">
          {getPrivacyIcon(trip.privacy)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <Link to={`/trips/${trip.id}`}>
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--pulse)] transition-colors line-clamp-2">
            {trip.title}
          </h3>
        </Link>

        {/* Description */}
        {trip.description && (
          <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
            {trip.description}
          </p>
        )}

        {/* Cities */}
        {trip.cities && trip.cities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {trip.cities.slice(0, 3).map((city, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--accent-teal)]/20 text-[var(--accent-teal)] text-xs rounded-full"
              >
                <MapPin className="w-3 h-3" />
                {city.name}
              </span>
            ))}
            {trip.cities.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 text-[var(--text-muted)] text-xs">
                +{trip.cities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta Information */}
        <div className="space-y-2 mb-4 text-sm">
          {/* Dates */}
          {trip.start_date && trip.end_date && (
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </span>
            </div>
          )}

          {/* Budget */}
          {trip.total_budget && (
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <DollarSign className="w-4 h-4" />
              <span>
                {trip.currency} {trip.total_budget.toLocaleString()}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-[var(--text-muted)]">
            {trip.companions_count !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{trip.companions_count}</span>
              </div>
            )}
            {trip.cities_count !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{trip.cities_count} {trip.cities_count === 1 ? 'city' : 'cities'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Creator Info */}
        {trip.creator_username && (
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
            {trip.creator_photo ? (
              <img
                src={trip.creator_photo}
                alt={trip.creator_name || trip.creator_username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--pulse)]/20 flex items-center justify-center">
                <span className="text-xs text-[var(--pulse)] font-medium">
                  {trip.creator_username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">
                {trip.creator_name || trip.creator_username}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Trip organizer</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(trip);
                }}
                className="flex-1 px-4 py-2 bg-[var(--pulse)] text-white rounded-lg hover:bg-[var(--pulse)]/90 transition-colors text-sm font-medium"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm('Are you sure you want to delete this trip?')) {
                    onDelete(trip.id);
                  }
                }}
                className="px-4 py-2 bg-[var(--error)]/20 text-[var(--error)] rounded-lg hover:bg-[var(--error)]/30 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <Link
        to={`/trips/${trip.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View ${trip.title}`}
      >
        <span className="sr-only">View trip details</span>
      </Link>
    </div>
  );
};

export default TripCard;
