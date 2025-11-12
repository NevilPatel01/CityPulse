import { apiRequest, apiEndpoints } from '../config/api';
import type {
  Trip,
  CreateTripData,
  UpdateTripData,
  TripCity,
  TripCompanion,
  TripItineraryItem,
  TripComment,
  TravelCompanionMatch,
  PublicTripDiscover,
  TripFilters
} from '../types/trip';

/**
 * Trip Service
 * Handles all trip-related API calls
 */

// Trip CRUD Operations
export const tripService = {
  // Get user's trips (created + participating)
  async getUserTrips(filters?: TripFilters): Promise<Trip[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.privacy) params.append('privacy', filters.privacy);
    
    const queryString = params.toString();
    const url = queryString ? `${apiEndpoints.trips.list}?${queryString}` : apiEndpoints.trips.list;
    
    const response = await apiRequest<{ data: Trip[] }>(url);
    return response.data;
  },

  // Get trip by ID with full details
  async getTripById(tripId: number): Promise<Trip> {
    const response = await apiRequest<{ data: Trip }>(
      apiEndpoints.trips.detail.replace(':id', tripId.toString())
    );
    return response.data;
  },

  // Create new trip
  async createTrip(data: CreateTripData): Promise<Trip> {
    const response = await apiRequest<{ data: Trip }>(
      apiEndpoints.trips.create,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return response.data;
  },

  // Update trip
  async updateTrip(tripId: number, data: UpdateTripData): Promise<Trip> {
    const response = await apiRequest<{ data: Trip }>(
      apiEndpoints.trips.update.replace(':id', tripId.toString()),
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    return response.data;
  },

  // Delete trip
  async deleteTrip(tripId: number): Promise<void> {
    await apiRequest(
      apiEndpoints.trips.delete.replace(':id', tripId.toString()),
      {
        method: 'DELETE'
      }
    );
  },

  // Companion Management
  async inviteCompanion(tripId: number, userId: number, message?: string): Promise<TripCompanion> {
    const response = await apiRequest<{ data: TripCompanion }>(
      apiEndpoints.trips.companions.invite.replace(':id', tripId.toString()),
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, message })
      }
    );
    return response.data;
  },

  async respondToInvitation(
    tripId: number,
    response: 'accepted' | 'declined'
  ): Promise<TripCompanion> {
    const res = await apiRequest<{ data: TripCompanion }>(
      apiEndpoints.trips.companions.respond.replace(':id', tripId.toString()),
      {
        method: 'PUT',
        body: JSON.stringify({ response })
      }
    );
    return res.data;
  },

  async removeCompanion(tripId: number, companionId: number): Promise<void> {
    await apiRequest(
      apiEndpoints.trips.companions.remove
        .replace(':id', tripId.toString())
        .replace(':companionId', companionId.toString()),
      {
        method: 'DELETE'
      }
    );
  },

  // City Management
  async addCityToTrip(
    tripId: number,
    data: {
      city_id: number;
      arrival_date?: string;
      departure_date?: string;
      notes?: string;
    }
  ): Promise<TripCity> {
    const response = await apiRequest<{ data: TripCity }>(
      apiEndpoints.trips.cities.add.replace(':id', tripId.toString()),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return response.data;
  },

  async updateTripCity(
    tripId: number,
    cityId: number,
    data: Partial<TripCity>
  ): Promise<TripCity> {
    const response = await apiRequest<{ data: TripCity }>(
      apiEndpoints.trips.cities.update
        .replace(':id', tripId.toString())
        .replace(':cityId', cityId.toString()),
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    return response.data;
  },

  async removeCityFromTrip(tripId: number, cityId: number): Promise<void> {
    await apiRequest(
      apiEndpoints.trips.cities.remove
        .replace(':id', tripId.toString())
        .replace(':cityId', cityId.toString()),
      {
        method: 'DELETE'
      }
    );
  },

  // Itinerary Management
  async getItinerary(tripId: number): Promise<TripItineraryItem[]> {
    const response = await apiRequest<{ data: TripItineraryItem[] }>(
      apiEndpoints.trips.itinerary.list.replace(':id', tripId.toString())
    );
    return response.data;
  },

  async addItineraryItem(
    tripId: number,
    data: Partial<TripItineraryItem>
  ): Promise<TripItineraryItem> {
    const response = await apiRequest<{ data: TripItineraryItem }>(
      apiEndpoints.trips.itinerary.add.replace(':id', tripId.toString()),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return response.data;
  },

  async updateItineraryItem(
    tripId: number,
    itemId: number,
    data: Partial<TripItineraryItem>
  ): Promise<TripItineraryItem> {
    const response = await apiRequest<{ data: TripItineraryItem }>(
      apiEndpoints.trips.itinerary.update
        .replace(':id', tripId.toString())
        .replace(':itemId', itemId.toString()),
      {
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
    return response.data;
  },

  async deleteItineraryItem(tripId: number, itemId: number): Promise<void> {
    await apiRequest(
      apiEndpoints.trips.itinerary.delete
        .replace(':id', tripId.toString())
        .replace(':itemId', itemId.toString()),
      {
        method: 'DELETE'
      }
    );
  },

  // Comments
  async getTripComments(tripId: number): Promise<TripComment[]> {
    const response = await apiRequest<{ data: TripComment[] }>(
      apiEndpoints.trips.comments.list.replace(':id', tripId.toString())
    );
    return response.data;
  },

  async addComment(tripId: number, commentText: string): Promise<TripComment> {
    const response = await apiRequest<{ data: TripComment }>(
      apiEndpoints.trips.comments.add.replace(':id', tripId.toString()),
      {
        method: 'POST',
        body: JSON.stringify({ comment_text: commentText })
      }
    );
    return response.data;
  },

  async deleteComment(tripId: number, commentId: number): Promise<void> {
    await apiRequest(
      apiEndpoints.trips.comments.delete
        .replace(':id', tripId.toString())
        .replace(':commentId', commentId.toString()),
      {
        method: 'DELETE'
      }
    );
  },

  // Companion Finder
  async findTravelCompanions(filters?: {
    city_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<TravelCompanionMatch[]> {
    const params = new URLSearchParams();
    if (filters?.city_id) params.append('city_id', filters.city_id.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString 
      ? `${apiEndpoints.trips.finder.companions}?${queryString}` 
      : apiEndpoints.trips.finder.companions;
    
    const response = await apiRequest<{ data: TravelCompanionMatch[] }>(url);
    return response.data;
  },

  async discoverPublicTrips(filters?: {
    city_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: PublicTripDiscover[]; pagination: any }> {
    const params = new URLSearchParams();
    if (filters?.city_id) params.append('city_id', filters.city_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    const url = queryString 
      ? `${apiEndpoints.trips.finder.discover}?${queryString}` 
      : apiEndpoints.trips.finder.discover;
    
    return await apiRequest<{ data: PublicTripDiscover[]; pagination: any }>(url);
  },

  async getUsersGoingToCity(cityId: number, upcomingOnly: boolean = true): Promise<TravelCompanionMatch[]> {
    const params = new URLSearchParams();
    params.append('upcoming_only', upcomingOnly.toString());
    
    const response = await apiRequest<{ data: TravelCompanionMatch[] }>(
      `${apiEndpoints.trips.finder.city.replace(':cityId', cityId.toString())}?${params.toString()}`
    );
    return response.data;
  },

  async getSuggestedTrips(limit: number = 10): Promise<Trip[]> {
    const response = await apiRequest<{ data: Trip[] }>(
      `${apiEndpoints.trips.finder.suggested}?limit=${limit}`
    );
    return response.data;
  }
};

export default tripService;
