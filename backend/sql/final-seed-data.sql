-- CityPulse Seed Data (Password: Password123!)
BEGIN;

-- Clean existing seed data
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%');
DELETE FROM trip_companions WHERE trip_id IN (SELECT id FROM trips WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%'));
DELETE FROM trip_itinerary WHERE trip_id IN (SELECT id FROM trips WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%'));
DELETE FROM trip_cities WHERE trip_id IN (SELECT id FROM trips WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%'));
DELETE FROM trips WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%');
DELETE FROM travel_buddy_connections WHERE requester_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%') OR requested_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%');
DELETE FROM recommendation_cities WHERE recommendation_id IN (SELECT id FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%'));
DELETE FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%');
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%citypulse-seed%');
DELETE FROM users WHERE email LIKE '%citypulse-seed%';

-- Create users
INSERT INTO users (username, email, password_hash, full_name, bio, current_location, hometown, email_verified, created_at)
VALUES 
    ('john_explorer', 'john.explorer@citypulse-seed.com', 
     '$2b$10$EeoPWRIWWW7GkJOzbea.ne62VgvQqIAGDMaGNu3JHAL0Zti9UC3yW', 
     'John Explorer', 'Passionate traveler and coffee enthusiast ☕', 
     'San Francisco, CA', 'New York, NY', true, NOW() - INTERVAL '6 months'),
    ('sarah_wanderer', 'sarah.wanderer@citypulse-seed.com', 
     '$2b$10$EeoPWRIWWW7GkJOzbea.ne62VgvQqIAGDMaGNu3JHAL0Zti9UC3yW', 
     'Sarah Wanderer', 'Digital nomad and food blogger 🍜', 
     'Barcelona, Spain', 'London, UK', true, NOW() - INTERVAL '5 months'),
    ('mike_adventurer', 'mike.adventurer@citypulse-seed.com', 
     '$2b$10$EeoPWRIWWW7GkJOzbea.ne62VgvQqIAGDMaGNu3JHAL0Zti9UC3yW', 
     'Mike Adventurer', 'Hiking enthusiast 🏔️', 
     'Denver, CO', 'Seattle, WA', true, NOW() - INTERVAL '4 months');

-- Create profiles
INSERT INTO user_profiles (user_id, travel_buddy_requests_enabled, profile_visibility)
SELECT id, true, 'public' FROM users WHERE email LIKE '%citypulse-seed%';

-- Create buddy connections
INSERT INTO travel_buddy_connections (requester_id, requested_id, status, created_at)
SELECT u1.id, u2.id, 'accepted', NOW() - INTERVAL '2 months'
FROM users u1, users u2
WHERE u1.email = 'john.explorer@citypulse-seed.com' AND u2.email = 'sarah.wanderer@citypulse-seed.com';

-- Create cities
INSERT INTO cities (name, country, latitude, longitude)
VALUES ('Paris', 'France', 48.8566, 2.3522), ('Tokyo', 'Japan', 35.6762, 139.6503), ('Barcelona', 'Spain', 41.3851, 2.1734)
ON CONFLICT DO NOTHING;

-- Create recommendations with correct categories
INSERT INTO recommendations (user_id, title, description, category_id, user_rating, difficulty_level, likes_count, views_count, created_at)
SELECT u.id, 'Café de Flore', 'Classic Parisian café with rich history', 
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant' LIMIT 1),
    5, 'easy', 45, 320, NOW() - INTERVAL '3 months'
FROM users u WHERE u.email = 'john.explorer@citypulse-seed.com'
UNION ALL
SELECT u.id, 'Tsukiji Outer Market', 'Best sushi breakfast in Tokyo!', 
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant' LIMIT 1),
    5, 'easy', 78, 523, NOW() - INTERVAL '2 months'
FROM users u WHERE u.email = 'sarah.wanderer@citypulse-seed.com';

-- Link recommendations to cities
INSERT INTO recommendation_cities (recommendation_id, city_id)
SELECT r.id, c.id FROM recommendations r, cities c
WHERE r.title = 'Café de Flore' AND c.name = 'Paris'
UNION ALL
SELECT r.id, c.id FROM recommendations r, cities c
WHERE r.title = 'Tsukiji Outer Market' AND c.name = 'Tokyo'
ON CONFLICT (recommendation_id, city_id) DO NOTHING;

-- Create trip
INSERT INTO trips (user_id, title, description, start_date, end_date, total_budget, privacy, status, is_collaborative, created_at)
SELECT id, 'European Adventure 2025', 'Paris and Barcelona summer trip', '2025-06-15', '2025-07-05', 5000, 'public', 'planning', true, NOW() - INTERVAL '1 month'
FROM users WHERE email = 'john.explorer@citypulse-seed.com';

-- Add cities to trip
INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date)
SELECT t.id, c.id, '2025-06-15'::date, '2025-06-22'::date
FROM trips t, cities c WHERE t.title = 'European Adventure 2025' AND c.name = 'Paris'
UNION ALL
SELECT t.id, c.id, '2025-06-22'::date, '2025-07-05'::date
FROM trips t, cities c WHERE t.title = 'European Adventure 2025' AND c.name = 'Barcelona';

-- Add trip companions
INSERT INTO trip_companions (trip_id, user_id, role, status, invited_at, responded_at)
SELECT t.id, u.id, 'participant', 'accepted', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'
FROM trips t, users u WHERE t.title = 'European Adventure 2025' AND u.email = 'sarah.wanderer@citypulse-seed.com';

COMMIT;

-- Verification
SELECT '✅ SEED DATA LOADED SUCCESSFULLY! 🎉' as message;
SELECT 'Test Users:' as info, username, email FROM users WHERE email LIKE '%citypulse-seed%';
SELECT 'Password for all users: Password123!' as credentials;
