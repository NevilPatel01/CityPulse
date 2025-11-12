/**
 * Trip Planning System Types
 * Week 9 Implementation
 */

export interface Trip {
  id: number;
  user_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  privacy: 'public' | 'buddies_only' | 'private';
  cover_photo_url?: string;
  cover_image_url?: string; // Alias for backend compatibility
  is_collaborative: boolean;
  total_budget?: number;
  currency: string;
  created_at: string;
  updated_at: string;
  
  // Populated fields from joins
  creator_username?: string;
  creator_name?: string;
  creator_photo?: string;
  companions_count?: number;
  cities_count?: number;
  activities_count?: number;
  comment_count?: number;
  cities?: TripCity[];
  companions?: TripCompanion[];
  itinerary?: TripItineraryItem[];
  itinerary_items?: TripItineraryItem[]; // Alias for backend compatibility
  recommendations?: TripRecommendation[];
  comments?: TripComment[];
}

export interface TripCity {
  id: number;
  trip_city_id?: number; // Alias for backend compatibility
  trip_id: number;
  city_id: number;
  arrival_date?: string;
  departure_date?: string;
  visit_order: number;
  notes?: string;
  created_at: string;
  
  // Populated from cities table
  name?: string;
  city_name?: string; // Alias for backend compatibility
  country?: string;
  photo_url?: string;
  description?: string;
}

export interface TripCompanion {
  id: number;
  companion_id?: number; // Alias for backend compatibility
  trip_id: number;
  user_id: number;
  status: 'invited' | 'accepted' | 'declined' | 'removed';
  role: 'organizer' | 'participant';
  invited_at: string;
  responded_at?: string;
  created_at: string;
  
  // Populated from users table
  username?: string;
  full_name?: string;
  profile_photo_url?: string;
}

export interface TripItineraryItem {
  id: number;
  trip_id: number;
  trip_city_id?: number;
  day_number: number;
  activity_date?: string;
  time_slot?: string;
  title: string;
  description?: string;
  activity_type: 'sightseeing' | 'dining' | 'accommodation' | 'transportation' | 'entertainment' | 'shopping' | 'other';
  duration_minutes?: number;
  estimated_cost?: number;
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  added_by: number;
  created_at: string;
  updated_at: string;
  
  // Populated fields
  added_by_username?: string;
  city_name?: string;
}

export interface TripRecommendation {
  id: number;
  trip_id: number;
  recommendation_id: number;
  status: 'wishlist' | 'planned' | 'visited' | 'skipped';
  added_by: number;
  notes?: string;
  created_at: string;
  
  // Populated from recommendations table
  title?: string;
  description?: string;
  photo_url?: string;
  user_rating?: number;
  category?: string;
  added_by_username?: string;
}

export interface TripComment {
  id: number;
  comment_id?: number; // Alias for backend compatibility
  trip_id: number;
  user_id: number;
  comment_text: string;
  created_at: string;
  can_delete?: boolean; // Permission flag from backend
  
  // Populated from users table
  username?: string;
  full_name?: string;
  profile_photo_url?: string;
}

export interface CreateTripData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  privacy: 'public' | 'buddies_only' | 'private';
  total_budget?: number;
  currency?: string;
  is_collaborative?: boolean;
  cover_photo_url?: string;
}

export interface UpdateTripData extends Partial<CreateTripData> {
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
}

export interface TravelCompanionMatch {
  id: number;
  username: string;
  full_name: string;
  profile_photo_url?: string;
  cities_visited?: number[];
  trip_id: number;
  trip_title: string;
  start_date: string;
  end_date: string;
  privacy: string;
  companions_count: number;
  cities: Array<{
    name: string;
    country: string;
  }>;
  buddy_status?: 'pending' | 'accepted' | 'declined';
  trip_companion_status?: 'invited' | 'accepted' | 'declined';
}

export interface PublicTripDiscover extends Trip {
  highlights?: Array<{
    id: number;
    title: string;
    photo_url?: string;
    category: string;
  }>;
}

export interface TripFilters {
  status?: 'planning' | 'active' | 'completed' | 'cancelled';
  privacy?: 'public' | 'buddies_only' | 'private';
  city_id?: number;
  start_date?: string;
  end_date?: string;
}
