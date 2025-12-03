import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Globe, Lock } from 'lucide-react';
import type { Trip } from '../../types/trip';
import Avatar from '../ui/Avatar';

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
      <div className="relative h-48 overflow-hidden">
        {trip.cover_photo_url ? (
          <img
            src={trip.cover_photo_url}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide broken image and show fallback
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-teal-500/20">
                    <div class="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                      <svg class="w-10 h-10 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <div class="text-center text-white/80 px-4">
                      <p class="font-medium text-sm">Travel Adventure</p>
                      <p class="text-xs opacity-75">Explore new destinations</p>
                    </div>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-teal-500/20">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
              <MapPin className="w-10 h-10 text-white/70" />
            </div>
            <div className="text-center text-white/80 px-4">
              <p className="font-medium text-sm">Travel Adventure</p>
              <p className="text-xs opacity-75">Explore new destinations</p>
            </div>
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

        {/* Creator Info - Always shown */}
        <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="relative">
            <Avatar
              src={trip.creator_photo}
              name={trip.creator_name || trip.creator_username}
              size="sm"
              className="border-2 border-[var(--border-subtle)]"
            />
            {/* Online status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {trip.creator_name || trip.creator_username || 'Anonymous User'}
            </p>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Users className="w-3 h-3" />
              Trip organizer
            </p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)] relative z-20">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
                  e.stopPropagation();
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

      {/* Hover Effect - Only applies to non-action areas */}
      <Link
        to={`/trips/${trip.id}`}
        className="absolute inset-0 z-10"
        style={{
          bottom: showActions && (onEdit || onDelete) ? '70px' : '0'
        }}
        aria-label={`View ${trip.title}`}
      >
        <span className="sr-only">View trip details</span>
      </Link>
    </div>
  );
};

export default TripCard;
