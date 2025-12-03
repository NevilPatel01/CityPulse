import { Calendar, MapPin, Users, Lock, Globe, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Trip } from '../../types/trip';
import Avatar from '../ui/Avatar';

interface TripFeedCardProps {
  trip: Trip;
}

export const TripFeedCard: React.FC<TripFeedCardProps> = ({ trip }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPrivacyIcon = () => {
    switch (trip.privacy) {
      case 'public':
        return <Globe size={14} className="text-green-400" />;
      case 'buddies_only':
        return <UsersRound size={14} className="text-blue-400" />;
      case 'private':
        return <Lock size={14} className="text-gray-400" />;
    }
  };

  const getPrivacyLabel = () => {
    switch (trip.privacy) {
      case 'public':
        return 'Public';
      case 'buddies_only':
        return 'Buddies Only';
      case 'private':
        return 'Private';
    }
  };

  return (
    <Link 
      to={`/trips/${trip.id}`}
      className="block bg-surface-glass backdrop-blur-glass rounded-lg border border-subtle shadow-glass hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Cover Image */}
      {trip.cover_photo_url || trip.cover_image_url ? (
        <div className="h-48 w-full relative overflow-hidden">
          <img
            src={trip.cover_photo_url || trip.cover_image_url}
            alt={trip.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image to prevent alt text from showing
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1 text-xs text-white">
            {getPrivacyIcon()}
            <span>{getPrivacyLabel()}</span>
          </div>
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-pulse/20 to-orange-500/20 flex items-center justify-center relative">
          <MapPin size={48} className="text-pulse opacity-40" />
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1 text-xs text-white">
            {getPrivacyIcon()}
            <span>{getPrivacyLabel()}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-text-primary mb-1 line-clamp-2">
              {trip.title}
            </h3>
            {trip.description && (
              <p className="text-sm text-text-secondary line-clamp-2">
                {trip.description}
              </p>
            )}
          </div>
        </div>

        {/* Trip Info */}
        <div className="space-y-2 mb-3">
          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Calendar size={16} className="text-pulse" />
            <span>
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
          </div>

          {/* Cities */}
          {trip.cities && trip.cities.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <MapPin size={16} className="text-pulse" />
              <span className="line-clamp-1">
                {trip.cities.map(city => city.name || city.city_name).filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Companions */}
          {trip.companions_count !== undefined && trip.companions_count > 0 && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Users size={16} className="text-pulse" />
              <span>
                {trip.companions_count} {trip.companions_count === 1 ? 'companion' : 'companions'}
              </span>
            </div>
          )}
        </div>

        {/* Creator */}
        <div className="flex items-center gap-3 pt-3 border-t border-subtle">
          <Avatar
            src={trip.creator_photo}
            name={trip.creator_name || trip.creator_username}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {trip.creator_name || trip.creator_username}
            </p>
            <p className="text-xs text-text-secondary">
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)} Trip
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
