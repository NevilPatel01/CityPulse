-- Add Travel Recommendation Categories
-- This script adds common travel categories that users can select from

INSERT INTO recommendation_categories (name, description) VALUES
('Restaurant', 'Restaurants, cafes, bars, and dining establishments'),
('Cafe', 'Coffee shops, tea houses, and casual dining spots'),
('Hotel', 'Hotels, resorts, hostels, and accommodation'),
('Attraction', 'Tourist attractions, landmarks, and sightseeing spots'),
('Beach', 'Beaches, coastal areas, and waterfront locations'),
('Hiking', 'Hiking trails, nature walks, and outdoor adventures'),
('Shopping', 'Shopping centers, markets, and retail areas'),
('Nightlife', 'Bars, clubs, entertainment venues, and nightlife spots'),
('Museum', 'Museums, galleries, and cultural institutions'),
('Park', 'Parks, gardens, and recreational areas'),
('Adventure', 'Adventure sports, extreme activities, and thrill experiences'),
('Spa', 'Spas, wellness centers, and relaxation venues'),
('Transportation', 'Transportation hubs, services, and travel-related facilities'),
('Entertainment', 'Theaters, cinemas, concerts, and entertainment venues'),
('Cultural', 'Cultural sites, festivals, and heritage locations'),
('Food Market', 'Food markets, street food, and local cuisine spots'),
('Viewpoint', 'Scenic viewpoints, lookouts, and photo spots'),
('Religious Site', 'Temples, churches, mosques, and spiritual places'),
('Local Experience', 'Unique local experiences and hidden gems'),
('Activity', 'Activities, workshops, and interactive experiences')
ON CONFLICT (name) DO NOTHING;