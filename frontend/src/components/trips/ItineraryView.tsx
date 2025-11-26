import React from 'react';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, Circle, XCircle, Edit2, Trash2 } from 'lucide-react';
import type { TripItineraryItem } from '../../types/trip';

interface ItineraryViewProps {
  items: TripItineraryItem[];
  onEdit?: (item: TripItineraryItem) => void;
  onDelete?: (itemId: number) => void;
  readOnly?: boolean;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ items, onEdit, onDelete, readOnly = false }) => {
  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      sightseeing: '🏛️',
      dining: '🍽️',
      accommodation: '🏨',
      transportation: '🚗',
      entertainment: '🎭',
      shopping: '🛍️',
      other: '📍',
    };
    return icons[type] || '📍';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[var(--success)]';
      case 'confirmed':
        return 'text-[var(--accent-teal)]';
      case 'planned':
        return 'text-[var(--pulse)]';
      case 'cancelled':
        return 'text-[var(--error)]';
      default:
        return 'text-[var(--text-muted)]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Group items by day
  const groupedItems = items.reduce((acc, item) => {
    const day = item.day_number;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(item);
    return acc;
  }, {} as Record<number, TripItineraryItem[]>);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
        <p className="text-[var(--text-muted)] text-lg">No itinerary items yet</p>
        <p className="text-[var(--text-muted)] text-sm mt-2">Start planning your trip by adding activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.keys(groupedItems)
        .sort((a, b) => Number(a) - Number(b))
        .map((day) => (
          <div key={day} className="relative">
            {/* Day Header */}
            <div className="sticky top-0 z-10 bg-[var(--base)]/95 backdrop-blur-sm py-3 mb-4">
              <h3 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--pulse)]" />
                <span>Day {day}</span>
                {groupedItems[Number(day)][0]?.activity_date && (
                  <span className="text-sm font-normal text-[var(--text-muted)] ml-2">
                    {formatDate(groupedItems[Number(day)][0].activity_date)}
                  </span>
                )}
              </h3>
            </div>

            {/* Timeline */}
            <div className="space-y-4 relative pl-8">
              {/* Timeline Line */}
              <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-[var(--border-subtle)]"></div>

              {groupedItems[Number(day)]
                .sort((a: TripItineraryItem, b: TripItineraryItem) => {
                  if (!a.time_slot || !b.time_slot) return 0;
                  return a.time_slot.localeCompare(b.time_slot);
                })
                .map((item: TripItineraryItem) => (
                  <div key={item.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[30px] top-6 ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                    </div>

                    {/* Item Card */}
                    <div className="bg-[var(--surface-glass)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--pulse)] transition-all duration-300">
                      <div className="flex items-start gap-4">
                        {/* Activity Icon */}
                        <div className="text-3xl">{getActivityIcon(item.activity_type)}</div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Time */}
                          {item.time_slot && (
                            <div className="flex items-center gap-1 text-sm text-[var(--pulse)] mb-2">
                              <Clock className="w-4 h-4" />
                              <span>{item.time_slot}</span>
                              {item.duration_minutes && (
                                <span className="text-[var(--text-muted)]">
                                  ({Math.floor(Number(item.duration_minutes) / 60)}h {Number(item.duration_minutes) % 60}m)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Title */}
                          <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                            {item.title}
                          </h4>

                          {/* Description */}
                          {item.description && (
                            <p className="text-sm text-[var(--text-muted)] mb-3">{item.description}</p>
                          )}

                          {/* Location */}
                          {item.location_name && (
                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{item.location_name}</span>
                              {item.city_name && (
                                <span className="text-xs">• {item.city_name}</span>
                              )}
                            </div>
                          )}

                          {/* Cost */}
                          {item.estimated_cost !== undefined && Number(item.estimated_cost) > 0 && (
                            <div className="flex items-center gap-2 text-sm text-[var(--accent-amber)]">
                              <DollarSign className="w-4 h-4" />
                              <span>{Number(item.estimated_cost).toFixed(2)}</span>
                            </div>
                          )}

                          {/* Added by */}
                          {item.added_by_username && (
                            <p className="text-xs text-[var(--text-muted)] mt-3">
                              Added by {item.added_by_username}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {!readOnly && (onEdit || onDelete) && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--pulse)] hover:bg-[var(--pulse)]/10 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Edit activity"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this activity?')) {
                                    onDelete(item.id);
                                  }
                                }}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Delete activity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                        <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">•</span>
                        <span className="text-xs text-[var(--text-muted)] capitalize">
                          {item.activity_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default ItineraryView;
