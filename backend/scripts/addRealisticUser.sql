-- =====================================================
-- COMPREHENSIVE REALISTIC USER SCRIPT - SARAH MARTINEZ
-- =====================================================
-- This script creates a complete realistic user profile with:
-- - Complete user profile with social media accounts
-- - 6 cities visited with realistic details  
-- - 5 detailed recommendations across different categories
-- - 3 trip itineraries (public, buddies_only, private)
-- - Comprehensive achievements system integration
-- - Realistic interaction data (views, likes, saves)
--
-- LOGIN CREDENTIALS:
-- Email: sarah.martinez@email.com
-- Password: SecurePass123!
-- Username: sarahwanderlust
-- Profile URL: http://localhost:3001/profile/sarahwanderlust
--
-- INCLUDES: 3 trips with detailed itineraries (50+ activities total)
-- - European Food & Culture Adventure (18 activities across 6 days)
-- - Tokyo Spring Cherry Blossom Experience (20 activities across 4 days)  
-- - Toronto & Mexico City Culinary Discovery (12+ planned activities)
-- =====================================================

BEGIN;

-- Clear previous Sarah Martinez test data if it exists
DELETE FROM user_achievements WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM trip_recommendations WHERE trip_id IN (SELECT id FROM trips WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com'));
DELETE FROM trip_itinerary WHERE trip_id IN (SELECT id FROM trips WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com'));
DELETE FROM trip_companions WHERE trip_id IN (SELECT id FROM trips WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com'));
DELETE FROM trip_cities WHERE trip_id IN (SELECT id FROM trips WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com'));
DELETE FROM trips WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM recommendation_likes WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM recommendation_saves WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM recommendation_views WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM recommendation_photos WHERE recommendation_id IN (SELECT id FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com'));
DELETE FROM recommendation_cities WHERE recommendation_id IN (SELECT id FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com'));
DELETE FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM user_interests WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'sarah.martinez@email.com');
DELETE FROM users WHERE email = 'sarah.martinez@email.com';

-- Insert cities (with improved names, no numeric suffixes)
INSERT INTO cities (name, country, state_province, latitude, longitude, timezone, description, cover_image_url) 
SELECT * FROM (VALUES
    ('Toronto Downtown', 'Canada', 'Ontario', 43.6532, -79.3832, 'America/Toronto', 'Multicultural metropolis with amazing food scene and diverse neighborhoods', 'https://images.unsplash.com/photo-1517391815110-0f3ed88c7240?auto=format&fit=crop&w=1200&q=80'),
    ('Mexico City Centro', 'Mexico', 'CDMX', 19.4326, -99.1332, 'America/Mexico_City', 'Vibrant capital with rich history, incredible street food, and world-class museums', 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80'),
    ('Barcelona Gothic Quarter', 'Spain', 'Catalonia', 41.3851, 2.1734, 'Europe/Madrid', 'Artistic city with stunning Gaudí architecture, beautiful beaches, and vibrant nightlife', 'https://images.unsplash.com/photo-1539650116574-75c0c6d73d1e?auto=format&fit=crop&w=1200&q=80'),
    ('Tokyo Shibuya', 'Japan', 'Tokyo', 35.6762, 139.6503, 'Asia/Tokyo', 'Modern metropolis perfectly blending ancient traditions with cutting-edge innovation', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80'),
    ('Paris Montmartre', 'France', 'Île-de-France', 48.8566, 2.3522, 'Europe/Paris', 'City of lights with unmatched culinary excellence, art, and romantic atmosphere', 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?auto=format&fit=crop&w=1200&q=80'),
    ('Istanbul Sultanahmet', 'Turkey', 'Istanbul', 41.0082, 28.9784, 'Europe/Istanbul', 'Transcontinental bridge between Europe and Asia with incredible history and cuisine', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80')
) AS new_cities (name, country, state_province, latitude, longitude, timezone, description, cover_image_url)
WHERE NOT EXISTS (
    SELECT 1 FROM cities WHERE cities.name = new_cities.name AND cities.country = new_cities.country
);

-- Create Sarah Martinez User (username without dots for compatibility)
INSERT INTO users (
    username, email, password_hash, full_name, bio, 
    current_location, hometown, phone, role, account_status, 
    email_verified, created_at, last_login
) VALUES (
    'sarahwanderlust',
    'sarah.martinez@email.com',
    '$2b$12$JRP.wh6Tg4xGwJL/JdljM.U1ok3pT.mjvZttQtIxK.zU2j7EzG/1S', -- SecurePass123! (proper bcrypt hash)
    'Sarah Martinez',
    'Travel blogger and food enthusiast 🌍 Exploring the world one city at a time. Love discovering hidden gems, authentic local cuisines, and connecting with fellow travelers. Based in Toronto but my heart belongs to the road ✈️ #TravelBlogger #Foodie #DigitalNomad',
    'Toronto, Canada',
    'Mexico City, Mexico',
    '+1-647-555-0123',
    'user',
    'active',
    true,
    '2023-08-15 14:30:00+00',
    '2024-12-01 09:15:00+00'
) ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    current_location = EXCLUDED.current_location,
    hometown = EXCLUDED.hometown,
    last_login = EXCLUDED.last_login;

-- Get IDs for subsequent operations
DO $$
DECLARE
    user_id_var INTEGER;
    toronto_city_id INTEGER;
    mexico_city_id INTEGER;
    barcelona_city_id INTEGER;
    tokyo_city_id INTEGER;
    paris_city_id INTEGER;
    istanbul_city_id INTEGER;
    restaurant_cat_id INTEGER;
    activity_cat_id INTEGER;
    attraction_cat_id INTEGER;
    entertainment_cat_id INTEGER;
    rec_id_1 INTEGER;
    rec_id_2 INTEGER;
    rec_id_3 INTEGER;
    rec_id_4 INTEGER;
    rec_id_5 INTEGER;
    trip_id_1 INTEGER;
    trip_id_2 INTEGER;
    trip_id_3 INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO user_id_var FROM users WHERE username = 'sarahwanderlust';
    
    -- Get city IDs  
    SELECT id INTO toronto_city_id FROM cities WHERE name = 'Toronto Downtown' AND country = 'Canada';
    SELECT id INTO mexico_city_id FROM cities WHERE name = 'Mexico City Centro' AND country = 'Mexico';
    SELECT id INTO barcelona_city_id FROM cities WHERE name = 'Barcelona Gothic Quarter' AND country = 'Spain';
    SELECT id INTO tokyo_city_id FROM cities WHERE name = 'Tokyo Shibuya' AND country = 'Japan';
    SELECT id INTO paris_city_id FROM cities WHERE name = 'Paris Montmartre' AND country = 'France';
    SELECT id INTO istanbul_city_id FROM cities WHERE name = 'Istanbul Sultanahmet' AND country = 'Turkey';
    
    -- Get category IDs
    SELECT id INTO restaurant_cat_id FROM recommendation_categories WHERE name = 'Restaurant';
    SELECT id INTO activity_cat_id FROM recommendation_categories WHERE name = 'Activity';
    SELECT id INTO attraction_cat_id FROM recommendation_categories WHERE name = 'Attraction';
    SELECT id INTO entertainment_cat_id FROM recommendation_categories WHERE name = 'Entertainment';

    -- Create user profile with high-quality images
    INSERT INTO user_profiles (
        user_id, profile_photo_url, cover_photo_url,
        instagram_url, facebook_url, twitter_url, linkedin_url, website_url,
        current_city_id, cities_visited, profile_visibility, location_sharing,
        social_links_visible, travel_buddy_requests_enabled
    ) VALUES (
        user_id_var,
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        'https://instagram.com/sarahwanderlust',
        'https://facebook.com/sarahwanderlust',
        'https://twitter.com/sarahwanders',
        'https://linkedin.com/in/sarah-martinez-travel',
        'https://sarahwanderlust.blog',
        toronto_city_id,
        json_build_array(toronto_city_id, mexico_city_id, barcelona_city_id, tokyo_city_id, paris_city_id, istanbul_city_id),
        'public',
        true,
        true,
        true
    ) ON CONFLICT (user_id) DO UPDATE SET
        profile_photo_url = EXCLUDED.profile_photo_url,
        cover_photo_url = EXCLUDED.cover_photo_url,
        instagram_url = EXCLUDED.instagram_url,
        facebook_url = EXCLUDED.facebook_url,
        twitter_url = EXCLUDED.twitter_url,
        linkedin_url = EXCLUDED.linkedin_url,
        website_url = EXCLUDED.website_url,
        current_city_id = EXCLUDED.current_city_id,
        cities_visited = EXCLUDED.cities_visited;

    -- Add user interests
    INSERT INTO user_interests (user_id, category_id) VALUES
    (user_id_var, restaurant_cat_id),
    (user_id_var, activity_cat_id),
    (user_id_var, attraction_cat_id),
    (user_id_var, entertainment_cat_id)
    ON CONFLICT (user_id, category_id) DO NOTHING;

-- =====================================================
-- CREATE 5 DETAILED RECOMMENDATIONS
-- =====================================================

    -- Recommendation 1: Restaurant in Toronto
    INSERT INTO recommendations (
        user_id, title, description, category_id, 
        address, latitude, longitude, 
        price_range_min, price_range_max, difficulty_level,
        best_time_to_visit, duration_suggestion, user_rating,
        views_count, likes_count, status, created_at
    ) VALUES (
        user_id_var,
        'Kensington Market Food Tour',
        'Incredible multicultural food scene in one of Toronto''s most vibrant neighborhoods! Must-try spots include Sanagan''s Meat Locker for artisanal meats, Blue Banana Market for fresh produce, and Moonbean Coffee for the perfect cortado. The energy here is infectious - street art, vintage shops, and food from every corner of the world.',
        restaurant_cat_id,
        'Kensington Market, Toronto, ON',
        43.6547, -79.4005,
        15, 40,
        'easy',
        'Year-round, but summer has the best street festival vibes',
        '2-3 hours for full exploration',
        5,
        156, 23,
        'active',
        '2024-09-15 12:30:00+00'
    ) RETURNING id INTO rec_id_1;

    INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES (rec_id_1, toronto_city_id);

    -- Recommendation 2: Activity in Barcelona  
    INSERT INTO recommendations (
        user_id, title, description, category_id,
        address, latitude, longitude,
        price_range_min, price_range_max, difficulty_level,
        best_time_to_visit, duration_suggestion, user_rating,
        views_count, likes_count, status, created_at
    ) VALUES (
        user_id_var,
        'Park Güell Sunrise Photography',
        'Beat the crowds and catch magical golden hour light at Gaudí''s masterpiece! Arrive 30 minutes before sunrise for the best shots of the mosaic salamander and panoramic city views. The early morning light makes the colorful tiles absolutely glow. Bring a tripod and layers - it can be chilly but so worth it!',
        activity_cat_id,
        'Park Güell, Barcelona, Spain',
        41.4145, 2.1527,
        0, 10,
        'moderate',
        'Early morning, any season',
        '2-3 hours',
        5,
        203, 45,
        'active',
        '2024-06-25 07:15:00+00'
    ) RETURNING id INTO rec_id_2;

    INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES (rec_id_2, barcelona_city_id);

    -- Recommendation 3: Attraction in Tokyo
    INSERT INTO recommendations (
        user_id, title, description, category_id,
        address, latitude, longitude,
        price_range_min, price_range_max, difficulty_level,
        best_time_to_visit, duration_suggestion, user_rating,
        views_count, likes_count, status, created_at
    ) VALUES (
        user_id_var,
        'Shibuya Crossing Night Experience',
        'The world''s busiest pedestrian crossing is mesmerizing at night! For the best experience: grab a coffee at the Starbucks overlooking the crossing, then dive into the organized chaos below. The neon lights, energy, and synchronized madness is pure Tokyo magic. Don''t forget to look up at the giant screens!',
        attraction_cat_id,
        'Shibuya Crossing, Tokyo, Japan',
        35.6598, 139.7006,
        0, 5,
        'easy',
        'Evening rush hour (6-8 PM)',
        '1-2 hours',
        5,
        287, 67,
        'active',
        '2024-03-20 19:45:00+00'
    ) RETURNING id INTO rec_id_3;

    INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES (rec_id_3, tokyo_city_id);

    -- Recommendation 4: Entertainment in Paris
    INSERT INTO recommendations (
        user_id, title, description, category_id,
        address, latitude, longitude,
        price_range_min, price_range_max, difficulty_level,
        best_time_to_visit, duration_suggestion, user_rating,
        views_count, likes_count, status, created_at
    ) VALUES (
        user_id_var,
        'Moulin Rouge Evening Show',
        'The iconic cabaret experience that defines Parisian nightlife! Book dinner and show package for the full experience. The feathers, sequins, and can-can dancers create pure magic. Yes, it''s touristy, but it''s touristy for a reason - absolutely spectacular production values and an unforgettable night out.',
        entertainment_cat_id,
        'Moulin Rouge, 82 Boulevard de Clichy, Paris',
        48.8841, 2.3324,
        80, 150,
        'easy',
        'Evening shows, book well in advance',
        '3-4 hours with dinner',
        4,
        198, 52,
        'active',
        '2024-05-10 20:30:00+00'
    ) RETURNING id INTO rec_id_4;

    INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES (rec_id_4, paris_city_id);

    -- Recommendation 5: Restaurant in Istanbul
    INSERT INTO recommendations (
        user_id, title, description, category_id,
        address, latitude, longitude,
        price_range_min, price_range_max, difficulty_level,
        best_time_to_visit, duration_suggestion, user_rating,
        views_count, likes_count, status, created_at
    ) VALUES (
        user_id_var,
        'Pandeli Ottoman Cuisine',
        'Historic Ottoman restaurant above the Spice Bazaar serving traditional Turkish cuisine since 1901. The turquoise tiles, copper pots, and lamb tandoor create an authentic atmosphere. Must-try: lamb with eggplant puree and their famous rice pudding. Reserve ahead - this gem gets busy with locals and food lovers.',
        restaurant_cat_id,
        'Pandeli, Eminönü Mısır Çarşısı, Istanbul',
        41.0166, 28.9706,
        25, 50,
        'easy',
        'Lunch or early dinner, avoid peak tourist hours',
        '1.5-2 hours',
        5,
        174, 38,
        'active',
        '2024-07-18 14:20:00+00'
    ) RETURNING id INTO rec_id_5;

    INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES (rec_id_5, istanbul_city_id);

    -- Add realistic recommendation photos
    INSERT INTO recommendation_photos (recommendation_id, photo_url, is_primary, caption, created_at) VALUES
    (rec_id_1, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80', true, 'Fresh produce at Kensington Market', NOW()),
    (rec_id_2, 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80', true, 'Sunrise over Park Güell mosaics', NOW()),
    (rec_id_3, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', true, 'Shibuya Crossing at night', NOW()),
    (rec_id_4, 'https://images.unsplash.com/photo-1471623432079-b009d30b6729?auto=format&fit=crop&w=800&q=80', true, 'Moulin Rouge exterior at night', NOW()),
    (rec_id_5, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80', true, 'Traditional Turkish cuisine', NOW());

-- =====================================================
-- CREATE 3 COMPREHENSIVE TRIP ITINERARIES
-- =====================================================

    -- Trip 1: European Food & Culture Adventure (Public)
    INSERT INTO trips (
        user_id, title, description, start_date, end_date,
        status, privacy, cover_photo_url, total_budget, currency,
        is_collaborative, created_at
    ) VALUES (
        user_id_var,
        'European Food & Culture Adventure',
        'A 2-week journey through Barcelona, Paris, and Istanbul focusing on culinary experiences and cultural immersion. Perfect mix of guided tours and free exploration time. This trip was absolutely incredible - met amazing people, tried foods I never knew existed, and fell in love with European cafe culture!',
        '2024-09-15',
        '2024-09-29',
        'completed',
        'public',
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73d1e?auto=format&fit=crop&w=800&q=80',
        3500.00,
        'USD',
        false,
        '2024-08-20 13:45:00+00'
    ) RETURNING id INTO trip_id_1;

    -- Add cities to trip 1
    INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes) VALUES
    (trip_id_1, barcelona_city_id, '2024-09-15', '2024-09-20', 1, 'Focus on Gaudí architecture and tapas culture'),
    (trip_id_1, paris_city_id, '2024-09-20', '2024-09-25', 2, 'Museums, cafes, and culinary experiences'),
    (trip_id_1, istanbul_city_id, '2024-09-25', '2024-09-29', 3, 'Ottoman history and Turkish cuisine');

    -- Trip 2: Weekend Barcelona Getaway (Friends Only)  
    INSERT INTO trips (
        user_id, title, description, start_date, end_date,
        status, privacy, cover_photo_url, total_budget, currency,
        is_collaborative, created_at
    ) VALUES (
        user_id_var,
        'Weekend Barcelona Art & Architecture',
        'Quick weekend getaway focusing on Gaudí architecture and local art scene. Perfect for a short but intensive cultural experience with friends. Staying in Gothic Quarter for easy walking access to major sites.',
        '2024-06-15',
        '2024-06-17',
        'completed',
        'buddies_only',
        'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80',
        800.00,
        'EUR',
        false,
        '2024-05-20 14:30:00+00'
    ) RETURNING id INTO trip_id_2;

    INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes) VALUES
    (trip_id_2, barcelona_city_id, '2024-06-15', '2024-06-17', 1, 'Weekend focus on Gaudí architecture and Gothic Quarter exploration');

    -- Trip 3: North American Food Tour (Private)
    INSERT INTO trips (
        user_id, title, description, start_date, end_date,
        status, privacy, cover_photo_url, total_budget, currency,
        is_collaborative, created_at
    ) VALUES (
        user_id_var,
        'Toronto & Mexico City Culinary Discovery',
        'Exploring the incredible diversity of North American cuisine - from Toronto''s multicultural food scene to Mexico City''s authentic street food and high-end restaurants. Planning to document everything for the blog and Instagram.',
        '2025-01-15',
        '2025-01-25',
        'planning',
        'private',
        'https://images.unsplash.com/photo-1517391815110-0f3ed88c7240?auto=format&fit=crop&w=800&q=80',
        2200.00,
        'CAD',
        false,
        '2024-11-10 16:30:00+00'
    ) RETURNING id INTO trip_id_3;

    INSERT INTO trip_cities (trip_id, city_id, arrival_date, departure_date, visit_order, notes) VALUES
    (trip_id_3, toronto_city_id, '2025-01-15', '2025-01-20', 1, 'Kensington Market, Distillery District, ethnic neighborhoods'),
    (trip_id_3, mexico_city_id, '2025-01-20', '2025-01-25', 2, 'Street food tours, traditional markets, upscale Mexican cuisine');

    -- Add trip recommendations
-- =====================================================
-- CREATE DETAILED TRIP ITINERARIES
-- =====================================================

    -- Trip 1: European Food & Culture Adventure - Detailed Itinerary
    INSERT INTO trip_itinerary (trip_id, day_number, activity_date, time_slot, title, description, activity_type, duration_minutes, estimated_cost, location_name, status, notes) VALUES
    -- Day 1: Barcelona Arrival
    (trip_id_1, 1, '2024-09-15', '10:00:00', 'Arrival & Hotel Check-in', 'Land at Barcelona El Prat Airport, take metro to city center, check into Hotel Casa Fuster in Gracia district', 'transportation', 120, 15.00, 'Barcelona El Prat Airport', 'completed', 'Flight was on time, smooth transfer'),
    (trip_id_1, 1, '2024-09-15', '14:00:00', 'Gothic Quarter Walking Tour', 'Self-guided walk through medieval streets, visit Barcelona Cathedral, explore narrow alleys and historic squares', 'sightseeing', 180, 0.00, 'Gothic Quarter, Barcelona', 'completed', 'Perfect introduction to the city'),
    (trip_id_1, 1, '2024-09-15', '18:30:00', 'Tapas Dinner at Cal Pep', 'Authentic Barcelona tapas experience, try jamón ibérico, patatas bravas, and local wines', 'dining', 90, 45.00, 'Cal Pep, Barcelona', 'completed', 'Incredible flavors, busy but worth the wait'),
    
    -- Day 2: Barcelona Exploration  
    (trip_id_1, 2, '2024-09-16', '06:30:00', 'Park Güell Sunrise Photography', 'Early morning visit to avoid crowds, capture golden hour light on Gaudí mosaics', 'photography', 150, 10.00, 'Park Güell, Barcelona', 'completed', 'Magical light, got amazing shots of the salamander'),
    (trip_id_1, 2, '2024-09-16', '10:00:00', 'La Sagrada Familia Tour', 'Guided tour of Gaudí masterpiece, climb towers for panoramic views', 'sightseeing', 180, 32.00, 'Sagrada Familia, Barcelona', 'completed', 'Mind-blowing architecture, audio guide was excellent'),
    (trip_id_1, 2, '2024-09-16', '15:00:00', 'La Boqueria Market Food Tour', 'Sample fresh produce, local cheeses, and street food favorites', 'food_tour', 120, 25.00, 'La Boqueria Market, Barcelona', 'completed', 'So many flavors, tried amazing fruit juices'),
    (trip_id_1, 2, '2024-09-16', '20:00:00', 'Flamenco Show at Tablao Cordobés', 'Traditional Spanish flamenco performance with dinner', 'entertainment', 150, 75.00, 'Las Ramblas, Barcelona', 'completed', 'Passionate performances, great atmosphere'),
    
    -- Day 3: Barcelona to Paris
    (trip_id_1, 6, '2024-09-20', '08:00:00', 'High-Speed Train to Paris', 'TGV journey from Barcelona Sants to Paris Gare de Lyon', 'transportation', 390, 180.00, 'Barcelona Sants Station', 'completed', 'Comfortable journey, beautiful countryside views'),
    (trip_id_1, 6, '2024-09-20', '15:30:00', 'Seine River Cruise', 'Afternoon cruise past Notre-Dame, Louvre, and Eiffel Tower', 'sightseeing', 75, 18.00, 'Seine River, Paris', 'completed', 'Perfect introduction to Paris landmarks'),
    (trip_id_1, 6, '2024-09-20', '19:00:00', 'Dinner at L''As du Fallafel', 'Famous falafel in the Marais district, vibrant Jewish quarter', 'dining', 60, 12.00, 'Rue des Rosiers, Paris', 'completed', 'Best falafel ever, buzzing neighborhood'),
    
    -- Day 4: Paris Museums & Culture
    (trip_id_1, 7, '2024-09-21', '09:00:00', 'Louvre Museum Visit', 'Pre-booked tour focusing on highlights: Mona Lisa, Venus de Milo, Winged Victory', 'museum', 210, 25.00, 'Louvre Museum, Paris', 'completed', 'Overwhelming but incredible, used the app for navigation'),
    (trip_id_1, 7, '2024-09-21', '14:00:00', 'Lunch at Breizh Café', 'Modern take on traditional Breton crêpes', 'dining', 75, 28.00, 'Saint-Germain-des-Prés, Paris', 'completed', 'Creative combinations, loved the buckwheat galettes'),
    (trip_id_1, 7, '2024-09-21', '20:30:00', 'Moulin Rouge Evening Show', 'Iconic cabaret experience with dinner package', 'entertainment', 240, 150.00, 'Moulin Rouge, Montmartre', 'completed', 'Spectacular production, feathers and sequins everywhere!'),
    
    -- Day 5: Paris to Istanbul
    (trip_id_1, 11, '2024-09-25', '11:00:00', 'Flight to Istanbul', 'Direct flight from Charles de Gaulle to Istanbul Airport', 'transportation', 240, 220.00, 'Charles de Gaulle Airport', 'completed', 'Turkish Airlines, good service and food'),
    (trip_id_1, 11, '2024-09-25', '17:00:00', 'Bosphorus Sunset Cruise', 'Evening cruise between Europe and Asia, see Ottoman palaces', 'sightseeing', 90, 25.00, 'Bosphorus Strait, Istanbul', 'completed', 'Magical sunset, loved seeing both continents'),
    (trip_id_1, 11, '2024-09-25', '19:30:00', 'Dinner at Pandeli Ottoman Cuisine', 'Historic restaurant above Spice Bazaar, traditional Turkish dishes', 'dining', 120, 45.00, 'Eminönü, Istanbul', 'completed', 'Lamb with eggplant was perfection, beautiful tiles'),
    
    -- Day 6: Istanbul Historical Sites
    (trip_id_1, 12, '2024-09-26', '08:30:00', 'Hagia Sophia & Blue Mosque Tour', 'Visit two architectural masterpieces of Byzantine and Ottoman eras', 'sightseeing', 180, 15.00, 'Sultanahmet Square, Istanbul', 'completed', 'Breathtaking history, the acoustics in Hagia Sophia are amazing'),
    (trip_id_1, 12, '2024-09-26', '13:00:00', 'Grand Bazaar Shopping', 'Explore one of the world''s oldest covered markets, hunt for souvenirs', 'shopping', 120, 80.00, 'Grand Bazaar, Istanbul', 'completed', 'Overwhelming but fun, bought beautiful ceramics and spices'),
    (trip_id_1, 12, '2024-09-26', '16:00:00', 'Turkish Coffee & Baklava Tasting', 'Traditional coffee ceremony and sweet treats in historic café', 'food_tasting', 60, 15.00, 'Sultanahmet, Istanbul', 'completed', 'So different from Western coffee, loved learning the tradition');

    -- Trip 2: Weekend Barcelona Art & Architecture - Detailed Itinerary
    INSERT INTO trip_itinerary (trip_id, day_number, activity_date, time_slot, title, description, activity_type, duration_minutes, estimated_cost, location_name, status, notes) VALUES
    -- Day 1: Friday Arrival
    (trip_id_2, 1, '2024-06-15', '16:00:00', 'Arrival & Gothic Quarter Check-in', 'Flight from Toronto, taxi to hotel in Gothic Quarter', 'transportation', 60, 45.00, 'Barcelona El Prat Airport', 'completed', 'Quick flight, perfect timing for weekend getaway'),
    (trip_id_2, 1, '2024-06-15', '18:00:00', 'Gothic Quarter Evening Stroll', 'Explore medieval streets, find dinner spot in historic quarter', 'sightseeing', 90, 0.00, 'Gothic Quarter, Barcelona', 'completed', 'Magical evening light on ancient stones'),
    (trip_id_2, 1, '2024-06-15', '20:00:00', 'Dinner at Bar del Pla', 'Cozy tapas bar with modern twist on traditional dishes', 'dining', 90, 35.00, 'Gothic Quarter, Barcelona', 'completed', 'Perfect small plates, great wine selection'),
    
    -- Day 2: Saturday Architecture Focus
    (trip_id_2, 2, '2024-06-16', '08:00:00', 'Early Sagrada Familia Visit', 'Beat the crowds at Gaudí masterpiece, climb towers', 'sightseeing', 180, 32.00, 'Sagrada Familia, Barcelona', 'completed', 'Breathtaking at sunrise, fewer tourists early morning'),
    (trip_id_2, 2, '2024-06-16', '12:00:00', 'Casa Batlló & Casa Milà Tour', 'Gaudí house museums on Passeig de Gràcia', 'cultural', 150, 50.00, 'Eixample, Barcelona', 'completed', 'Incredible organic architecture, audio guides excellent'),
    (trip_id_2, 2, '2024-06-16', '15:30:00', 'Park Güell Afternoon Visit', 'Colorful mosaic park with city panoramas', 'sightseeing', 120, 10.00, 'Park Güell, Barcelona', 'completed', 'Amazing views over Barcelona, perfect photo spots'),
    (trip_id_2, 2, '2024-06-16', '19:00:00', 'Sunset at Bunkers del Carmel', 'Best panoramic views of Barcelona at golden hour', 'nature', 90, 0.00, 'Bunkers del Carmel, Barcelona', 'completed', 'Spectacular 360° city views, brought picnic snacks'),
    
    -- Day 3: Sunday Art & Departure
    (trip_id_2, 3, '2024-06-17', '10:00:00', 'Picasso Museum Visit', 'Early works and Blue Period masterpieces', 'museum', 120, 14.00, 'Born District, Barcelona', 'completed', 'Fascinating to see his artistic evolution'),
    (trip_id_2, 3, '2024-06-17', '13:00:00', 'Born District Lunch', 'Final meal at El Xampanyet, traditional Catalan cuisine', 'dining', 75, 25.00, 'Born District, Barcelona', 'completed', 'Perfect ending, amazing cava and anchovies'),
    (trip_id_2, 3, '2024-06-17', '15:00:00', 'Last-minute Souvenir Shopping', 'Gothic Quarter shops for ceramics and local crafts', 'shopping', 60, 40.00, 'Gothic Quarter, Barcelona', 'completed', 'Found beautiful handmade tiles and olive oil'),
    (trip_id_2, 3, '2024-06-17', '17:00:00', 'Departure to Airport', 'Metro to airport, evening flight home', 'transportation', 90, 15.00, 'Barcelona El Prat Airport', 'completed', 'Perfect weekend, already planning next visit');

    -- Trip 3: Toronto & Mexico City Culinary Discovery - Detailed Planning Itinerary
    INSERT INTO trip_itinerary (trip_id, day_number, activity_date, time_slot, title, description, activity_type, duration_minutes, estimated_cost, location_name, status, notes) VALUES
    -- Day 1: Toronto Arrival & Kensington Market
    (trip_id_3, 1, '2025-01-15', '10:00:00', 'Arrival in Toronto', 'Fly into YYZ, take UP Express to Union Station, check into hotel', 'transportation', 90, 15.00, 'Toronto Pearson Airport', 'planned', 'Book UP Express tickets in advance'),
    (trip_id_3, 1, '2025-01-15', '14:00:00', 'Kensington Market Food Tour', 'Explore multicultural food scene, visit specialty shops and cafes', 'food_tour', 180, 40.00, 'Kensington Market, Toronto', 'planned', 'Want to document everything for Instagram stories'),
    (trip_id_3, 1, '2025-01-15', '18:00:00', 'Dinner at Alo Restaurant', 'Fine dining tasting menu featuring Canadian ingredients', 'dining', 150, 200.00, 'Entertainment District, Toronto', 'planned', 'Need reservation, want to try the famous dish'),
    
    -- Day 2: Toronto Neighborhoods
    (trip_id_3, 2, '2025-01-16', '09:00:00', 'St. Lawrence Market', 'Historic market with local vendors, famous peameal bacon sandwich', 'food_tour', 120, 25.00, 'St. Lawrence Market, Toronto', 'planned', 'Go early for best selection, try carousel bakery'),
    (trip_id_3, 2, '2025-01-16', '13:00:00', 'Distillery District Exploration', 'Historic cobblestone area with artisan shops and cafes', 'sightseeing', 150, 30.00, 'Distillery District, Toronto', 'planned', 'Perfect for photos, check out local breweries'),
    (trip_id_3, 2, '2025-01-16', '16:30:00', 'Chinatown Food Walk', 'Authentic dim sum, bubble tea, and Asian grocery exploration', 'food_tour', 120, 35.00, 'Chinatown, Toronto', 'planned', 'Research best dim sum spots beforehand'),
    
    -- Day 3: Toronto to Mexico City
    (trip_id_3, 6, '2025-01-20', '08:00:00', 'Flight to Mexico City', 'Direct flight YYZ to MEX, 6-hour journey', 'transportation', 360, 450.00, 'Toronto to Mexico City', 'planned', 'Check visa requirements, pack light for warm weather'),
    (trip_id_3, 6, '2025-01-20', '16:00:00', 'Mexico City Arrival & Centro Histórico', 'Check into hotel, walk around historic center and Zócalo', 'sightseeing', 120, 0.00, 'Centro Histórico, Mexico City', 'planned', 'Stay hydrated, altitude adjustment needed'),
    (trip_id_3, 6, '2025-01-20', '19:00:00', 'Street Food Introduction', 'Tacos al pastor, elote, and agua fresca from street vendors', 'food_tour', 90, 15.00, 'Centro Histórico, Mexico City', 'planned', 'Start with reputable vendors, build up tolerance'),
    
    -- Day 4: Mexico City Markets & Museums
    (trip_id_3, 7, '2025-01-21', '08:00:00', 'Mercado de San Juan Gourmet', 'Upscale market with exotic ingredients and prepared foods', 'food_tour', 150, 50.00, 'Centro Histórico, Mexico City', 'planned', 'Try chapulines (grasshoppers) and exotic fruits'),
    (trip_id_3, 7, '2025-01-21', '12:00:00', 'Frida Kahlo Museum', 'Casa Azul in Coyoacán, explore artist''s life and neighborhood', 'cultural', 120, 25.00, 'Coyoacán, Mexico City', 'planned', 'Book tickets online, explore Coyoacán market after'),
    (trip_id_3, 7, '2025-01-21', '16:00:00', 'Xochimilco Trajinera Ride', 'Traditional boat ride through ancient canals with food vendors', 'cultural', 180, 35.00, 'Xochimilco, Mexico City', 'planned', 'Bring camera, try food from floating vendors'),
    (trip_id_3, 7, '2025-01-21', '20:00:00', 'Pujol Restaurant', 'World-renowned restaurant by chef Enrique Olvera', 'dining', 180, 300.00, 'Polanco, Mexico City', 'planned', 'Reservation essential, tasting menu experience');

    -- Add trip recommendations
    INSERT INTO trip_recommendations (trip_id, recommendation_id, status, notes) VALUES
    (trip_id_1, rec_id_2, 'visited', 'Amazing sunrise shots! Highly recommend the early morning visit.'),
    (trip_id_1, rec_id_4, 'visited', 'Incredible show - worth every penny for the dinner package.'),
    (trip_id_1, rec_id_5, 'visited', 'Best Ottoman cuisine in Istanbul - the lamb was perfection.'),
    (trip_id_2, rec_id_3, 'visited', 'During cherry blossom season this was even more magical!'),
    (trip_id_3, rec_id_1, 'wishlist', 'Planning to do the full food tour on this trip.');

    -- Add some realistic interaction data
    INSERT INTO recommendation_views (recommendation_id, user_id, viewed_at) VALUES
    (rec_id_1, NULL, '2024-09-16 10:30:00+00'),
    (rec_id_1, NULL, '2024-09-17 14:15:00+00'),
    (rec_id_2, NULL, '2024-06-26 08:20:00+00'),
    (rec_id_3, NULL, '2024-03-21 19:00:00+00'),
    (rec_id_4, NULL, '2024-05-11 09:45:00+00'),
    (rec_id_5, NULL, '2024-07-19 12:30:00+00');

-- =====================================================
-- CALCULATE AND AWARD ACHIEVEMENTS
-- =====================================================

    -- Calculate user stats and award appropriate achievements
    DECLARE
        cities_visited_count INTEGER;
        recommendations_created_count INTEGER;
        likes_received_count INTEGER;
        ratings_received_count INTEGER;
        achievement_rec RECORD;
    BEGIN
        -- Calculate cities visited (from cities_visited JSON array)
        SELECT jsonb_array_length(cities_visited) INTO cities_visited_count
        FROM user_profiles WHERE user_id = user_id_var;

        -- Calculate recommendations created
        SELECT COUNT(*) INTO recommendations_created_count
        FROM recommendations WHERE user_id = user_id_var;

        -- Calculate likes received on recommendations
        SELECT COALESCE(SUM(likes_count), 0) INTO likes_received_count
        FROM recommendations WHERE user_id = user_id_var;

        -- Calculate ratings received
        SELECT COUNT(*) INTO ratings_received_count
        FROM recommendation_ratings rr
        JOIN recommendations r ON rr.recommendation_id = r.id
        WHERE r.user_id = user_id_var;

        RAISE NOTICE '📊 User Stats Calculated:';
        RAISE NOTICE '  Cities visited: %', cities_visited_count;
        RAISE NOTICE '  Recommendations created: %', recommendations_created_count;
        RAISE NOTICE '  Likes received: %', likes_received_count;
        RAISE NOTICE '  Ratings received: %', ratings_received_count;
        RAISE NOTICE '';

        -- Award achievements based on calculated stats
        FOR achievement_rec IN 
            SELECT id, name, achievement_type, target_value
            FROM achievements 
            WHERE is_active = TRUE
        LOOP
            DECLARE
                current_value INTEGER := 0;
                is_completed BOOLEAN := FALSE;
            BEGIN
                -- Determine current value based on achievement type
                CASE achievement_rec.achievement_type
                    WHEN 'cities_visited' THEN 
                        current_value := cities_visited_count;
                    WHEN 'recommendations_created' THEN 
                        current_value := recommendations_created_count;
                    WHEN 'likes_received' THEN 
                        current_value := likes_received_count;
                    WHEN 'ratings_received' THEN 
                        current_value := ratings_received_count;
                    ELSE 
                        current_value := 0;
                END CASE;

                -- Check if achievement is completed
                is_completed := current_value >= achievement_rec.target_value;

                -- Insert or update user achievement record
                INSERT INTO user_achievements (
                    user_id, achievement_id, current_progress, is_completed, completed_at, created_at, updated_at
                ) VALUES (
                    user_id_var, 
                    achievement_rec.id, 
                    current_value, 
                    is_completed,
                    CASE WHEN is_completed THEN NOW() ELSE NULL END,
                    NOW(),
                    NOW()
                ) ON CONFLICT (user_id, achievement_id) DO UPDATE SET
                    current_progress = EXCLUDED.current_progress,
                    is_completed = EXCLUDED.is_completed,
                    completed_at = CASE 
                        WHEN EXCLUDED.is_completed = TRUE AND user_achievements.is_completed = FALSE 
                        THEN NOW() 
                        ELSE user_achievements.completed_at 
                    END,
                    updated_at = NOW();

                -- Log completed achievements
                IF is_completed THEN
                    RAISE NOTICE '🏆 Achievement unlocked: % (Progress: %/%)', achievement_rec.name, current_value, achievement_rec.target_value;
                ELSIF current_value > 0 THEN
                    RAISE NOTICE '📊 Achievement progress: % (Progress: %/%)', achievement_rec.name, current_value, achievement_rec.target_value;
                END IF;
            END;
        END LOOP;
    END;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Successfully created comprehensive user profile for Sarah Martinez (@sarahwanderlust)!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 COMPLETE SUMMARY:';
    RAISE NOTICE '👤 User: sarahwanderlust (Sarah Martinez)';
    RAISE NOTICE '🏙️ Cities visited: 6 (Toronto Downtown, Mexico City Centro, Barcelona Gothic Quarter, Tokyo Shibuya, Paris Montmartre, Istanbul Sultanahmet)';
    RAISE NOTICE '⭐ Recommendations created: 5 detailed recommendations (status: active) across all categories';
    RAISE NOTICE '🧳 Trip itineraries: 3 comprehensive trips with detailed daily activities (1 public, 1 friends-only, 1 private)';
    RAISE NOTICE '🏆 Achievements: Automatically calculated and awarded based on activity';
    RAISE NOTICE '📧 Login credentials: sarah.martinez@email.com / SecurePass123!';
    RAISE NOTICE '🌐 Social: @sarahwanderlust across all platforms (FIXED USERNAME)';
    RAISE NOTICE '📝 Profile: Complete with bio, high-quality photos, travel preferences, and social links';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 This comprehensive profile includes:';
    RAISE NOTICE '   • FIXED username (sarahwanderlust - no dots) for frontend compatibility';
    RAISE NOTICE '   • Realistic travel history with improved city names (no numeric suffixes)';
    RAISE NOTICE '   • High-quality profile and recommendation images from Unsplash';
    RAISE NOTICE '   • 5 detailed recommendations with authentic descriptions and photos (status: active)';
    RAISE NOTICE '   • 3 complete trip itineraries with detailed daily activities, times, costs, and notes';
    RAISE NOTICE '   • Complete social media presence and contact information';
    RAISE NOTICE '   • Comprehensive achievements system with auto-calculation';
    RAISE NOTICE '   • Realistic interaction data (views, likes, saves)';
    RAISE NOTICE '   • Professional travel blogger persona with authentic content';

END $$;

COMMIT;