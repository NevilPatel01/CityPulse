-- Week 9: Trip Planning System Seed Data
-- Sample trips for testing

-- Trip 1: Tokyo Adventure (axis_dev, completed trip)
INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy, total_budget, currency, created_at)
VALUES (
    11,
    'Tokyo Cherry Blossom Adventure',
    'Exploring Tokyo during cherry blossom season with traditional temples, modern tech, and amazing food',
    '2024-03-15',
    '2024-03-25',
    'completed',
    'public',
    3500.00,
    'USD',
    NOW() - INTERVAL '2 months'
) RETURNING id;

-- Let's use ID 1 for Tokyo trip
INSERT INTO trip_companions (trip_id, user_id, role, status, invited_at, responded_at)
VALUES
(1, 11, 'organizer', 'accepted', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
(1, 12, 'participant', 'accepted', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months');

INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes)
VALUES
(1, 7, '2024-03-15', '2024-03-25', 1, 'Main destination - cherry blossom viewing');

-- Trip 2: Paris Summer (nexplorer, active trip)
INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy, total_budget, currency, created_at)
VALUES (
    12,
    'Romantic Paris Summer Getaway',
    'Two weeks exploring art, culture, and cuisine in the City of Light',
    '2025-06-10',
    '2025-06-24',
    'planning',
    'buddies_only',
    4200.00,
    'EUR',
    NOW() - INTERVAL '1 month'
);

INSERT INTO trip_companions (trip_id, user_id, role, status, invited_at, responded_at)
VALUES
(2, 12, 'organizer', 'accepted', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
(2, 11, 'participant', 'pending', NOW() - INTERVAL '2 weeks', NULL);

INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes)
VALUES
(2, 8, '2025-06-10', '2025-06-24', 1, 'Art museums, cafes, and Eiffel Tower');

-- Trip 3: European Adventure (axis_dev, future trip)
INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy, total_budget, currency, created_at)
VALUES (
    11,
    'Grand European Tour',
    'Multi-city adventure across Europe visiting historical sites and experiencing diverse cultures',
    '2025-07-15',
    '2025-08-05',
    'planning',
    'public',
    6500.00,
    'USD',
    NOW() - INTERVAL '3 weeks'
);

INSERT INTO trip_companions (trip_id, user_id, role, status, invited_at, responded_at)
VALUES
(3, 11, 'organizer', 'accepted', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks');

INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes)
VALUES
(3, 8, '2025-07-15', '2025-07-20', 1, 'First stop - Louvre, Versailles'),
(3, 10, '2025-07-21', '2025-07-27', 2, 'Sagrada Familia, beaches, tapas'),
(3, 11, '2025-07-28', '2025-08-05', 3, 'Final stop - museums, theatre, shopping');

-- Trip 4: Bali Wellness Retreat (temp_user1, planning)
INSERT INTO trips (user_id, title, description, start_date, end_date, status, privacy, total_budget, currency, created_at)
VALUES (
    3,
    'Bali Wellness and Culture Retreat',
    'Two weeks of yoga, meditation, temple visits, and beach relaxation',
    '2025-09-01',
    '2025-09-14',
    'planning',
    'public',
    2800.00,
    'USD',
    NOW() - INTERVAL '1 week'
);

INSERT INTO trip_companions (trip_id, user_id, role, status, invited_at, responded_at)
VALUES
(4, 3, 'organizer', 'accepted', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week');

INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes)
VALUES
(4, 12, '2025-09-01', '2025-09-14', 1, 'Ubud yoga, beaches, temples');

-- Add some itinerary items for completed Tokyo trip
INSERT INTO trip_itinerary (trip_id, trip_city_id, day_number, activity_date, time_slot, title, description, activity_type, duration_minutes, estimated_cost, location_name, status, added_by, created_at)
VALUES
(1, 1, 1, '2024-03-15', '14:00:00', 'Check-in at Hotel', 'Arrive and settle into accommodation', 'accommodation', 120, 0.00, 'Shibuya Hotel', 'completed', 11, NOW() - INTERVAL '2 months'),
(1, 1, 2, '2024-03-16', '09:00:00', 'Senso-ji Temple Visit', 'Ancient Buddhist temple in Asakusa', 'sightseeing', 180, 0.00, 'Senso-ji Temple, Asakusa', 'completed', 11, NOW() - INTERVAL '2 months'),
(1, 1, 2, '2024-03-16', '14:00:00', 'Lunch at Tsukiji Market', 'Fresh sushi and seafood tasting', 'dining', 90, 45.00, 'Tsukiji Outer Market', 'completed', 11, NOW() - INTERVAL '2 months'),
(1, 1, 3, '2024-03-17', '10:00:00', 'Meiji Shrine Cherry Blossoms', 'Cherry blossom viewing at famous shrine', 'sightseeing', 120, 0.00, 'Meiji Shrine, Harajuku', 'completed', 12, NOW() - INTERVAL '2 months'),
(1, 1, 4, '2024-03-18', '09:00:00', 'teamLab Borderless Digital Art', 'Immersive digital art museum experience', 'entertainment', 180, 32.00, 'teamLab Borderless, Odaiba', 'completed', 11, NOW() - INTERVAL '2 months');

-- Add itinerary items for European tour (planning stage)
INSERT INTO trip_itinerary (trip_id, trip_city_id, day_number, activity_date, time_slot, title, description, activity_type, duration_minutes, estimated_cost, location_name, status, added_by, created_at)
VALUES
(3, 3, 1, '2025-07-15', '15:00:00', 'Hotel Check-in', 'Arrive in Paris and check into hotel', 'accommodation', 60, 0.00, 'Le Marais District', 'planned', 11, NOW() - INTERVAL '3 weeks'),
(3, 3, 2, '2025-07-16', '10:00:00', 'Louvre Museum', 'Explore world-famous art museum', 'sightseeing', 240, 17.00, 'Louvre Museum', 'planned', 11, NOW() - INTERVAL '3 weeks'),
(3, 3, 3, '2025-07-17', '14:00:00', 'Eiffel Tower Visit', 'Iconic landmark with city views', 'sightseeing', 150, 26.00, 'Eiffel Tower', 'planned', 11, NOW() - INTERVAL '3 weeks'),
(3, 4, 6, '2025-07-21', '16:00:00', 'Arrive in Barcelona', 'Train from Paris to Barcelona', 'transportation', 360, 120.00, 'Barcelona Sants Station', 'planned', 11, NOW() - INTERVAL '2 weeks'),
(3, 4, 7, '2025-07-22', '11:00:00', 'Sagrada Familia Tour', 'Gaudi''s masterpiece basilica', 'sightseeing', 120, 26.00, 'Sagrada Familia', 'planned', 11, NOW() - INTERVAL '2 weeks'),
(3, 5, 12, '2025-07-28', '09:00:00', 'British Museum', 'World history and culture collection', 'sightseeing', 180, 0.00, 'British Museum', 'planned', 11, NOW() - INTERVAL '1 week');

-- Add some trip comments
INSERT INTO trip_comments (trip_id, user_id, comment_text, created_at)
VALUES
(1, 12, 'This was an amazing trip! The cherry blossoms were absolutely beautiful.', NOW() - INTERVAL '1 month'),
(1, 11, 'Thanks for joining! That teamLab museum was mind-blowing.', NOW() - INTERVAL '1 month'),
(3, 11, 'Super excited for this trip! Anyone have restaurant recommendations for Barcelona?', NOW() - INTERVAL '1 week');

-- Link some recommendations to trips (assuming some recommendation IDs exist)
-- You may need to adjust these IDs based on actual recommendation data
INSERT INTO trip_recommendations (trip_id, recommendation_id, status, added_by, notes, created_at)
SELECT 1, r.id, 'visited', 11, 'Highly recommended!', NOW() - INTERVAL '1 month'
FROM recommendations r
WHERE r.id BETWEEN 1 AND 3
LIMIT 3;

INSERT INTO trip_recommendations (trip_id, recommendation_id, status, added_by, notes, created_at)
SELECT 3, r.id, 'wishlist', 11, 'Want to visit', NOW() - INTERVAL '2 weeks'
FROM recommendations r
WHERE r.id BETWEEN 4 AND 7
LIMIT 4;

SELECT 'Trip planning seed data inserted successfully' as status;
