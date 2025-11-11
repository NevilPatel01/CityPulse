-- =====================================================
-- CityPulse - Seed Data for Development & Testing
-- Creates 2 users with 7-10 recommendations each
-- =====================================================

-- Clean existing test data (in reverse FK order)
DELETE FROM recommendation_saves WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM recommendation_views WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM recommendation_likes WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM recommendation_ratings WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM recommendation_photos WHERE recommendation_id IN (SELECT id FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer')));
DELETE FROM recommendation_tag_links WHERE recommendation_id IN (SELECT id FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer')));
DELETE FROM recommendation_cities WHERE recommendation_id IN (SELECT id FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer')));
DELETE FROM recommendations WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM user_interests WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM travel_preferences WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM travel_buddy_connections WHERE requester_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM travel_buddy_connections WHERE requested_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM user_city_visits WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
DELETE FROM users WHERE username IN ('axis_dev', 'nexplorer');

-- =====================================================
-- 1. CREATE CITIES (if they don't exist)
-- =====================================================
INSERT INTO cities (name, country, state_province, latitude, longitude, timezone, description) VALUES
('Tokyo', 'Japan', 'Tokyo', 35.6762, 139.6503, 'Asia/Tokyo', 'A vibrant metropolis blending ancient traditions with cutting-edge technology'),
('Paris', 'France', 'Île-de-France', 48.8566, 2.3522, 'Europe/Paris', 'The City of Light, known for art, fashion, gastronomy and culture'),
('New York', 'United States', 'New York', 40.7128, -74.0060, 'America/New_York', 'The city that never sleeps, a global hub of culture, finance and entertainment'),
('Barcelona', 'Spain', 'Catalonia', 41.3851, 2.1734, 'Europe/Madrid', 'A coastal city famous for its art, architecture, and Mediterranean lifestyle'),
('London', 'United Kingdom', 'England', 51.5074, -0.1278, 'Europe/London', 'A historic city mixing royal heritage with modern innovation'),
('Bali', 'Indonesia', 'Bali', -8.3405, 115.0920, 'Asia/Makassar', 'A tropical paradise known for beaches, temples, and spiritual wellness');

-- =====================================================
-- 2. CREATE USERS
-- =====================================================
-- Password for both users: Test123!
-- Hash generated using bcrypt with salt rounds 10
INSERT INTO users (username, email, password_hash, full_name, bio, current_location, hometown, role, account_status, email_verified, created_at) VALUES
('axis_dev', 'axis@citypulse.com', '$2b$10$rH4pJ9K.mXqZVXf6oVX/xO7Y8YnZGf3qL.h8vN5mQ2RjK4pL6XyGK', 'Axis Patel', 'Adventure seeker and food enthusiast. Love discovering hidden gems in every city I visit. Coffee addict ☕ | Photography lover 📸', 'Tokyo', 'San Francisco', 'user', 'active', true, NOW() - INTERVAL '6 months'),
('nexplorer', 'nexplorer@citypulse.com', '$2b$10$rH4pJ9K.mXqZVXf6oVX/xO7Y8YnZGf3qL.h8vN5mQ2RjK4pL6XyGK', 'Nexo Explorer', 'Cultural explorer and art lover. Always searching for authentic local experiences. Museum fanatic 🎨 | Foodie 🍜 | Solo traveler ✈️', 'Paris', 'Barcelona', 'user', 'active', true, NOW() - INTERVAL '8 months');

-- =====================================================
-- 3. CREATE USER PROFILES
-- =====================================================
INSERT INTO user_profiles (user_id, cities_visited, profile_visibility, location_sharing) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'), 
    '["Tokyo", "Seoul", "Bangkok", "Singapore", "Hong Kong", "Taipei"]'::JSONB,
    'public', true),
((SELECT id FROM users WHERE username = 'nexplorer'), 
    '["Paris", "Barcelona", "Rome", "London", "Amsterdam", "Prague"]'::JSONB,
    'public', true);

-- =====================================================
-- 4. CREATE TRAVEL PREFERENCES
-- =====================================================
INSERT INTO travel_preferences (user_id, travel_style, activity_level, preferred_difficulty) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'), 'Adventure', 'High', 'Moderate'),
((SELECT id FROM users WHERE username = 'nexplorer'), 'Cultural', 'Moderate', 'Easy');

-- =====================================================
-- 5. CREATE USER INTERESTS
-- =====================================================
INSERT INTO user_interests (user_id, interest_category_id) VALUES
-- Alex's interests
((SELECT id FROM users WHERE username = 'axis_dev'), (SELECT id FROM interest_categories WHERE name = 'Adventure')),
((SELECT id FROM users WHERE username = 'axis_dev'), (SELECT id FROM interest_categories WHERE name = 'Food & Dining')),
((SELECT id FROM users WHERE username = 'axis_dev'), (SELECT id FROM interest_categories WHERE name = 'Photography')),
-- Sarah's interests
((SELECT id FROM users WHERE username = 'nexplorer'), (SELECT id FROM interest_categories WHERE name = 'Culture')),
((SELECT id FROM users WHERE username = 'nexplorer'), (SELECT id FROM interest_categories WHERE name = 'Food & Dining')),
((SELECT id FROM users WHERE username = 'nexplorer'), (SELECT id FROM interest_categories WHERE name = 'Relaxation'));

-- =====================================================
-- 6. CREATE CITY VISITS
-- =====================================================
INSERT INTO user_city_visits (user_id, city_id, visit_date) VALUES
-- Alex's visits
((SELECT id FROM users WHERE username = 'axis_dev'), (SELECT id FROM cities WHERE name = 'Tokyo'), '2024-03-15'),
((SELECT id FROM users WHERE username = 'axis_dev'), (SELECT id FROM cities WHERE name = 'New York'), '2024-06-20'),
((SELECT id FROM users WHERE username = 'axis_dev'), (SELECT id FROM cities WHERE name = 'Bali'), '2024-08-10'),
-- Sarah's visits
((SELECT id FROM users WHERE username = 'nexplorer'), (SELECT id FROM cities WHERE name = 'Paris'), '2024-02-10'),
((SELECT id FROM users WHERE username = 'nexplorer'), (SELECT id FROM cities WHERE name = 'Barcelona'), '2024-05-05'),
((SELECT id FROM users WHERE username = 'nexplorer'), (SELECT id FROM cities WHERE name = 'London'), '2024-09-15');

-- =====================================================
-- 7. CREATE RECOMMENDATIONS - ALEX (Tokyo & New York)
-- =====================================================

-- Alex Recommendation 1: Tsukiji Outer Market (Tokyo)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'), 
    'Tsukiji Outer Market', 
    'Experience the freshest sushi and seafood at Tokyo''s iconic market. Get there early (around 5-6 AM) for the best selection. Don''t miss the amazing street food - the grilled scallops and tamagoyaki are must-tries! The market has a incredible energy with vendors calling out their fresh catches. Wear comfortable shoes and bring cash as most vendors don''t accept cards.',
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant'),
    10.00, 30.00, 'Easy', '5 Chome-2-1 Tsukiji, Chuo City, Tokyo', 35.6654, 139.7707,
    'Early morning (5-10 AM)', '2-3 hours', 5, 342, 89, 45, NOW() - INTERVAL '4 months');

-- Link to Tokyo
INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), (SELECT id FROM cities WHERE name = 'Tokyo'));

-- Alex Recommendation 2: teamLab Borderless (Tokyo)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'),
    'teamLab Borderless Digital Art Museum',
    'Mind-blowing immersive digital art experience! This place is pure magic - walking through rooms where art flows around you and responds to your movements. The Forest of Resonating Lamps is absolutely stunning. Book tickets online in advance as it sells out quickly. Best visited on weekdays to avoid crowds. Allow at least 2-3 hours to fully explore. It''s an Instagram paradise but also just amazing to experience in person.',
    (SELECT id FROM recommendation_categories WHERE name = 'Attraction'),
    25.00, 35.00, 'Easy', 'Palette Town, Aomi, Koto City, Tokyo', 35.6262, 139.7753,
    'Weekday afternoons', '2-3 hours', 5, 521, 156, 98, NOW() - INTERVAL '4 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), (SELECT id FROM cities WHERE name = 'Tokyo'));

-- Alex Recommendation 3: Mount Takao Hiking (Tokyo)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'),
    'Mount Takao Hiking Trail',
    'Perfect day trip from Tokyo! About an hour by train from Shinjuku. Multiple trail options ranging from easy paved paths to challenging climbs. Trail 1 is the most popular and takes about 90 minutes to the summit. The view of Mount Fuji on clear days is spectacular! There are temples along the way and a beer garden at the top. Great workout with rewarding views. Bring water and snacks, though there are some food stalls too.',
    (SELECT id FROM recommendation_categories WHERE name = 'Activity'),
    5.00, 15.00, 'Moderate', 'Takaomachi, Hachioji, Tokyo', 35.6252, 139.2441,
    'Spring or Fall, early morning start', '4-5 hours', 4, 287, 67, 52, NOW() - INTERVAL '3 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Mount Takao Hiking Trail'), (SELECT id FROM cities WHERE name = 'Tokyo'));

-- Alex Recommendation 4: Omoide Yokocho (Tokyo)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'),
    'Omoide Yokocho (Memory Lane)',
    'Narrow alleyways packed with tiny yakitori joints and izakayas. This place transports you back to old Tokyo! The atmosphere is incredible - smoky, crowded, authentic. Each stall only seats about 5-8 people. Try the grilled chicken skewers, beef tongue, and don''t skip the sake. Cash only, most places. Can get pretty smoky so not ideal if you''re sensitive. Best experienced with friends. Expect to spend 2-3k yen per person.',
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant'),
    15.00, 35.00, 'Easy', '1 Chome Nishishinjuku, Shinjuku City, Tokyo', 35.6938, 139.7004,
    'Evening (6-11 PM)', '1-2 hours', 5, 412, 103, 67, NOW() - INTERVAL '3 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Omoide Yokocho (Memory Lane)'), (SELECT id FROM cities WHERE name = 'Tokyo'));

-- Alex Recommendation 5: Central Park Running (New York)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'),
    'Central Park Running Loop',
    'The full loop is 6.1 miles of scenic running through the heart of Manhattan! Start early morning (around 6-7 AM) to beat the crowds and catch the sunrise. The path is well-maintained and there are water fountains along the way. You''ll pass iconic spots like Bethesda Fountain, The Lake, and the Reservoir. In fall, the foliage is absolutely stunning. Great people-watching too. Download a park map before you go - it''s easy to get turned around!',
    (SELECT id FROM recommendation_categories WHERE name = 'Activity'),
    0.00, 0.00, 'Moderate', 'Central Park, Manhattan, New York', 40.7829, -73.9654,
    'Early morning, especially spring and fall', '1-2 hours', 5, 198, 42, 28, NOW() - INTERVAL '2 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Central Park Running Loop'), (SELECT id FROM cities WHERE name = 'New York'));

-- Alex Recommendation 6: Joe's Pizza (New York)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'),
    'Joe''s Pizza - Greenwich Village',
    'Classic New York slice! This place has been serving perfect pizza since 1975. The cheese slice is simple but absolutely delicious - crispy crust, perfect ratio of sauce and cheese. Always a line but it moves fast. Grab a slice, fold it, and eat it standing up like a true New Yorker. Cash only. Usually $3-4 per slice. No frills, just damn good pizza. There are a few Joe''s locations but this original one in the Village has the best vibe.',
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant'),
    3.00, 10.00, 'Easy', '7 Carmine St, New York, NY', 40.7304, -74.0028,
    'Lunch or late night', '15-30 minutes', 5, 356, 98, 71, NOW() - INTERVAL '2 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Joe''s Pizza - Greenwich Village'), (SELECT id FROM cities WHERE name = 'New York'));

-- Alex Recommendation 7: Brooklyn Bridge Walk (New York)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'),
    'Brooklyn Bridge Walk at Sunset',
    'One of the most iconic walks in NYC! Start from the Manhattan side and walk toward Brooklyn for the best views of the skyline. The bridge is about 1.1 miles. Sunset is magical - arrive about 45 minutes before sunset to get good photos. Stay on the pedestrian path (bikes have their own lane). Once in Brooklyn, explore DUMBO neighborhood for amazing photo spots with the Manhattan Bridge view. Then grab dinner at Grimaldi''s or Juliana''s for pizza. Total experience: 2-3 hours.',
    (SELECT id FROM recommendation_categories WHERE name = 'Activity'),
    0.00, 0.00, 'Easy', 'Brooklyn Bridge, New York', 40.7061, -73.9969,
    'Golden hour/sunset', '1-2 hours', 5, 445, 127, 89, NOW() - INTERVAL '1 month');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Brooklyn Bridge Walk at Sunset'), (SELECT id FROM cities WHERE name = 'New York'));

-- =====================================================
-- 8. CREATE RECOMMENDATIONS - SARAH (Paris, Barcelona, London)
-- =====================================================

-- Sarah Recommendation 1: Musée d'Orsay (Paris)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'Musée d''Orsay',
    'My favorite museum in Paris! Housed in a stunning Beaux-Arts railway station, it has the world''s finest collection of Impressionist art. The building itself is a masterpiece. Don''t miss Monet''s Water Lilies, Van Gogh''s Starry Night Over the Rhône, and Renoir''s Bal du moulin de la Galette. The top floor has incredible views through the old station clock. Book tickets online to skip the line. Visit on Thursday evening (open until 9:45 PM) for fewer crowds and special ambiance.',
    (SELECT id FROM recommendation_categories WHERE name = 'Attraction'),
    14.00, 18.00, 'Easy', '1 Rue de la Légion d''Honneur, Paris', 48.8600, 2.3266,
    'Thursday evenings or early morning weekdays', '2-3 hours', 5, 623, 187, 124, NOW() - INTERVAL '5 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Musée d''Orsay'), (SELECT id FROM cities WHERE name = 'Paris'));

-- Sarah Recommendation 2: Le Marais District (Paris)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'Le Marais District Walking Tour',
    'The most charming neighborhood in Paris! Medieval streets, historic mansions, trendy boutiques, and incredible falafel. Start at Place des Vosges (oldest planned square in Paris), wander through the Jewish Quarter, stop at L''As du Fallafel for the best falafel in the city. Don''t miss the hidden courtyards and art galleries. So many cute cafés for breaks. Sunday afternoons are lovely when shops are open. Wear comfortable walking shoes - cobblestones everywhere!',
    (SELECT id FROM recommendation_categories WHERE name = 'Activity'),
    20.00, 50.00, 'Easy', 'Le Marais, Paris', 48.8566, 2.3603,
    'Sunday afternoons', '3-4 hours', 5, 389, 112, 76, NOW() - INTERVAL '5 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Le Marais District Walking Tour'), (SELECT id FROM cities WHERE name = 'Paris'));

-- Sarah Recommendation 3: Café de Flore (Paris)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'Café de Flore',
    'Historic literary café where Sartre and Simone de Beauvoir used to write! Yes, it''s touristy and pricey, but the ambiance is worth it. The Art Deco interior is stunning and perfectly preserved. Order a café crème and a croissant, sit at the terrace, and people-watch. The hot chocolate is famous. Service can be slow but that''s part of the Parisian café culture - you''re paying for the experience and can stay as long as you want. Bring a book or journal!',
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant'),
    15.00, 30.00, 'Easy', '172 Boulevard Saint-Germain, Paris', 48.8543, 2.3324,
    'Morning for breakfast', '1-2 hours', 4, 478, 134, 87, NOW() - INTERVAL '4 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Café de Flore'), (SELECT id FROM cities WHERE name = 'Paris'));

-- Sarah Recommendation 4: Sagrada Familia (Barcelona)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'Sagrada Familia Basilica',
    'Gaudí''s unfinished masterpiece is absolutely breathtaking! The architecture is like nothing else in the world. Book tickets with tower access weeks in advance - it sells out fast. The stained glass windows create the most beautiful light inside, especially in the morning. The Nativity facade tells stories through intricate sculptures. Allow 2-3 hours minimum. Audio guide is excellent and included. The ongoing construction is fascinating too - it''s expected to be completed around 2026!',
    (SELECT id FROM recommendation_categories WHERE name = 'Attraction'),
    26.00, 36.00, 'Easy', 'Carrer de Mallorca, 401, Barcelona', 41.4036, 2.1744,
    'Early morning for best light', '2-3 hours', 5, 712, 245, 167, NOW() - INTERVAL '3 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), (SELECT id FROM cities WHERE name = 'Barcelona'));

-- Sarah Recommendation 5: Park Güell (Barcelona)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'Park Güell',
    'Another Gaudí wonder with incredible mosaic work and city views! The colorful lizard fountain is iconic. The serpentine bench covered in trencadís mosaics is stunning. Book a timed entry ticket online (€10) - the park is free but the monumental zone requires tickets. Go early or late to avoid crowds. The walk up from the metro is steep but worth it. Wear good shoes. Free areas of the park are also beautiful and have great viewpoints. Budget 2 hours for the monumental zone plus extra for exploring the free areas.',
    (SELECT id FROM recommendation_categories WHERE name = 'Attraction'),
    10.00, 13.00, 'Moderate', 'Carrer d''Olot, Barcelona', 41.4145, 2.1527,
    'Early morning or sunset', '2-3 hours', 5, 591, 178, 142, NOW() - INTERVAL '3 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Park Güell'), (SELECT id FROM cities WHERE name = 'Barcelona'));

-- Sarah Recommendation 6: La Boqueria Market (Barcelona)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'La Boqueria Market',
    'Incredible food market right off Las Ramblas! The colors and smells are overwhelming in the best way. Fresh fruit, seafood, jamón ibérico, and so much more. The fruit juice stands are famous - try a fresh smoothie. There are small counter bars inside where you can eat - the seafood is super fresh. Get there early (before 10 AM) to avoid tourist crowds. It''s much more authentic then and locals do their shopping. Bring cash for smaller vendors. Don''t just take photos - actually buy and eat!',
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant'),
    10.00, 25.00, 'Easy', 'La Rambla, 91, Barcelona', 41.3818, 2.1713,
    'Early morning (8-10 AM)', '1-2 hours', 5, 534, 167, 119, NOW() - INTERVAL '2 months');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'La Boqueria Market'), (SELECT id FROM cities WHERE name = 'Barcelona'));

-- Sarah Recommendation 7: British Museum (London)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'British Museum',
    'One of the world''s greatest museums and it''s FREE! The collection is massive - you could spend days here. Must-sees: Rosetta Stone, Egyptian mummies, Parthenon sculptures, and Assyrian lion hunt reliefs. The Great Court with its glass roof is stunning. Download their app for self-guided tours. The museum café is good for a break. I recommend focusing on 2-3 galleries per visit rather than trying to see everything. Weekday mornings are quietest. The gift shop is excellent!',
    (SELECT id FROM recommendation_categories WHERE name = 'Attraction'),
    0.00, 0.00, 'Easy', 'Great Russell St, London', 51.5194, -0.1270,
    'Weekday mornings', '2-4 hours', 5, 456, 143, 98, NOW() - INTERVAL '1 month');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'British Museum'), (SELECT id FROM cities WHERE name = 'London'));

-- Sarah Recommendation 8: Sketch London (London)
INSERT INTO recommendations (user_id, title, description, category_id, price_range_min, price_range_max, difficulty_level, address, latitude, longitude, best_time_to_visit, duration_suggestion, user_rating, views_count, likes_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'nexplorer'),
    'Sketch London - Afternoon Tea',
    'The most Instagram-worthy afternoon tea in London! The Gallery room is pink perfection with velvet chairs and David Shrigley artwork. The egg-shaped bathrooms are iconic - yes, go see them! Afternoon tea includes finger sandwiches, scones with clotted cream, and beautiful pastries. It''s pricey (around £70-80 per person) but the experience is unique. Book well in advance. Dress code is smart casual. Perfect for a special occasion or if you want to treat yourself.',
    (SELECT id FROM recommendation_categories WHERE name = 'Restaurant'),
    70.00, 90.00, 'Easy', '9 Conduit St, Mayfair, London', 51.5142, -0.1412,
    'Afternoon (sittings at 12, 2:30, 5 PM)', '2 hours', 4, 389, 121, 94, NOW() - INTERVAL '1 month');

INSERT INTO recommendation_cities (recommendation_id, city_id) VALUES
((SELECT id FROM recommendations WHERE title = 'Sketch London - Afternoon Tea'), (SELECT id FROM cities WHERE name = 'London'));

-- =====================================================
-- 9. ADD RECOMMENDATION PHOTOS (sample URLs)
-- =====================================================
INSERT INTO recommendation_photos (recommendation_id, photo_url, is_primary, caption) VALUES
-- Tsukiji photos
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), '/uploads/recommendations/tsukiji-market-1.jpg', true, 'Fresh seafood stalls'),
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), '/uploads/recommendations/tsukiji-market-2.jpg', false, 'Grilled scallops'),
-- teamLab photos
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), '/uploads/recommendations/teamlab-1.jpg', true, 'Forest of Resonating Lamps'),
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), '/uploads/recommendations/teamlab-2.jpg', false, 'Floating flowers'),
-- Mount Takao photos
((SELECT id FROM recommendations WHERE title = 'Mount Takao Hiking Trail'), '/uploads/recommendations/takao-1.jpg', true, 'Summit view'),
-- Omoide Yokocho photos
((SELECT id FROM recommendations WHERE title = 'Omoide Yokocho (Memory Lane)'), '/uploads/recommendations/omoide-1.jpg', true, 'Alleyway at night'),
-- Central Park photos
((SELECT id FROM recommendations WHERE title = 'Central Park Running Loop'), '/uploads/recommendations/central-park-1.jpg', true, 'Running path in fall'),
-- Joe's Pizza photos
((SELECT id FROM recommendations WHERE title = 'Joe''s Pizza - Greenwich Village'), '/uploads/recommendations/joes-pizza-1.jpg', true, 'Classic NY slice'),
-- Brooklyn Bridge photos
((SELECT id FROM recommendations WHERE title = 'Brooklyn Bridge Walk at Sunset'), '/uploads/recommendations/brooklyn-bridge-1.jpg', true, 'Bridge at sunset'),
-- Musée d'Orsay photos
((SELECT id FROM recommendations WHERE title = 'Musée d''Orsay'), '/uploads/recommendations/orsay-1.jpg', true, 'Main hall with clock'),
((SELECT id FROM recommendations WHERE title = 'Musée d''Orsay'), '/uploads/recommendations/orsay-2.jpg', false, 'Impressionist gallery'),
-- Le Marais photos
((SELECT id FROM recommendations WHERE title = 'Le Marais District Walking Tour'), '/uploads/recommendations/marais-1.jpg', true, 'Place des Vosges'),
-- Café de Flore photos
((SELECT id FROM recommendations WHERE title = 'Café de Flore'), '/uploads/recommendations/cafe-flore-1.jpg', true, 'Historic café interior'),
-- Sagrada Familia photos
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), '/uploads/recommendations/sagrada-1.jpg', true, 'Exterior facade'),
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), '/uploads/recommendations/sagrada-2.jpg', false, 'Interior stained glass'),
-- Park Güell photos
((SELECT id FROM recommendations WHERE title = 'Park Güell'), '/uploads/recommendations/park-guell-1.jpg', true, 'Mosaic lizard'),
-- La Boqueria photos
((SELECT id FROM recommendations WHERE title = 'La Boqueria Market'), '/uploads/recommendations/boqueria-1.jpg', true, 'Fresh fruit display'),
-- British Museum photos
((SELECT id FROM recommendations WHERE title = 'British Museum'), '/uploads/recommendations/british-museum-1.jpg', true, 'Great Court'),
-- Sketch photos
((SELECT id FROM recommendations WHERE title = 'Sketch London - Afternoon Tea'), '/uploads/recommendations/sketch-1.jpg', true, 'Pink Gallery room');

-- =====================================================
-- 10. ADD SOME TAGS
-- =====================================================
INSERT INTO recommendation_tags (name) VALUES
('Family Friendly'), ('Instagram Worthy'), ('Budget Friendly'), ('Hidden Gem'), 
('Local Favorite'), ('Must See'), ('Romantic'), ('Solo Traveler'), 
('Foodie'), ('Adventure'), ('Culture'), ('Photography'), ('Authentic')
ON CONFLICT (name) DO NOTHING;

-- Link tags to recommendations
INSERT INTO recommendation_tag_links (recommendation_id, tag_id) VALUES
-- Tsukiji
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), (SELECT id FROM recommendation_tags WHERE name = 'Foodie')),
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), (SELECT id FROM recommendation_tags WHERE name = 'Must See')),
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), (SELECT id FROM recommendation_tags WHERE name = 'Local Favorite')),
-- teamLab
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), (SELECT id FROM recommendation_tags WHERE name = 'Instagram Worthy')),
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), (SELECT id FROM recommendation_tags WHERE name = 'Must See')),
-- Mount Takao
((SELECT id FROM recommendations WHERE title = 'Mount Takao Hiking Trail'), (SELECT id FROM recommendation_tags WHERE name = 'Adventure')),
((SELECT id FROM recommendations WHERE title = 'Mount Takao Hiking Trail'), (SELECT id FROM recommendation_tags WHERE name = 'Photography')),
-- Omoide Yokocho
((SELECT id FROM recommendations WHERE title = 'Omoide Yokocho (Memory Lane)'), (SELECT id FROM recommendation_tags WHERE name = 'Authentic')),
((SELECT id FROM recommendations WHERE title = 'Omoide Yokocho (Memory Lane)'), (SELECT id FROM recommendation_tags WHERE name = 'Foodie')),
((SELECT id FROM recommendations WHERE title = 'Omoide Yokocho (Memory Lane)'), (SELECT id FROM recommendation_tags WHERE name = 'Local Favorite')),
-- Central Park
((SELECT id FROM recommendations WHERE title = 'Central Park Running Loop'), (SELECT id FROM recommendation_tags WHERE name = 'Budget Friendly')),
((SELECT id FROM recommendations WHERE title = 'Central Park Running Loop'), (SELECT id FROM recommendation_tags WHERE name = 'Solo Traveler')),
-- Joe's Pizza
((SELECT id FROM recommendations WHERE title = 'Joe''s Pizza - Greenwich Village'), (SELECT id FROM recommendation_tags WHERE name = 'Budget Friendly')),
((SELECT id FROM recommendations WHERE title = 'Joe''s Pizza - Greenwich Village'), (SELECT id FROM recommendation_tags WHERE name = 'Local Favorite')),
-- Brooklyn Bridge
((SELECT id FROM recommendations WHERE title = 'Brooklyn Bridge Walk at Sunset'), (SELECT id FROM recommendation_tags WHERE name = 'Instagram Worthy')),
((SELECT id FROM recommendations WHERE title = 'Brooklyn Bridge Walk at Sunset'), (SELECT id FROM recommendation_tags WHERE name = 'Romantic')),
-- Musée d'Orsay
((SELECT id FROM recommendations WHERE title = 'Musée d''Orsay'), (SELECT id FROM recommendation_tags WHERE name = 'Must See')),
((SELECT id FROM recommendations WHERE title = 'Musée d''Orsay'), (SELECT id FROM recommendation_tags WHERE name = 'Culture')),
-- Le Marais
((SELECT id FROM recommendations WHERE title = 'Le Marais District Walking Tour'), (SELECT id FROM recommendation_tags WHERE name = 'Culture')),
((SELECT id FROM recommendations WHERE title = 'Le Marais District Walking Tour'), (SELECT id FROM recommendation_tags WHERE name = 'Photography')),
-- Café de Flore
((SELECT id FROM recommendations WHERE title = 'Café de Flore'), (SELECT id FROM recommendation_tags WHERE name = 'Instagram Worthy')),
((SELECT id FROM recommendations WHERE title = 'Café de Flore'), (SELECT id FROM recommendation_tags WHERE name = 'Romantic')),
-- Sagrada Familia
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), (SELECT id FROM recommendation_tags WHERE name = 'Must See')),
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), (SELECT id FROM recommendation_tags WHERE name = 'Instagram Worthy')),
-- Park Güell
((SELECT id FROM recommendations WHERE title = 'Park Güell'), (SELECT id FROM recommendation_tags WHERE name = 'Must See')),
((SELECT id FROM recommendations WHERE title = 'Park Güell'), (SELECT id FROM recommendation_tags WHERE name = 'Instagram Worthy')),
-- La Boqueria
((SELECT id FROM recommendations WHERE title = 'La Boqueria Market'), (SELECT id FROM recommendation_tags WHERE name = 'Foodie')),
((SELECT id FROM recommendations WHERE title = 'La Boqueria Market'), (SELECT id FROM recommendation_tags WHERE name = 'Local Favorite')),
-- British Museum
((SELECT id FROM recommendations WHERE title = 'British Museum'), (SELECT id FROM recommendation_tags WHERE name = 'Budget Friendly')),
((SELECT id FROM recommendations WHERE title = 'British Museum'), (SELECT id FROM recommendation_tags WHERE name = 'Must See')),
((SELECT id FROM recommendations WHERE title = 'British Museum'), (SELECT id FROM recommendation_tags WHERE name = 'Family Friendly')),
-- Sketch
((SELECT id FROM recommendations WHERE title = 'Sketch London - Afternoon Tea'), (SELECT id FROM recommendation_tags WHERE name = 'Instagram Worthy')),
((SELECT id FROM recommendations WHERE title = 'Sketch London - Afternoon Tea'), (SELECT id FROM recommendation_tags WHERE name = 'Romantic'));

-- =====================================================
-- 11. ADD SOME RATINGS FROM OTHER USERS
-- =====================================================
-- We'll simulate ratings by creating a few additional test users who rated these recommendations
INSERT INTO users (username, email, full_name, email_verified, created_at) VALUES
('temp_user1', 'temp1@test.com', 'Test User 1', true, NOW()),
('temp_user2', 'temp2@test.com', 'Test User 2', true, NOW()),
('temp_user3', 'temp3@test.com', 'Test User 3', true, NOW())
ON CONFLICT (username) DO NOTHING;

-- Add ratings
INSERT INTO recommendation_ratings (recommendation_id, user_id, rating, review, created_at) VALUES
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), (SELECT id FROM users WHERE username = 'nexplorer'), 5, 'Alex was spot on! Best sushi I''ve ever had. Got there at 6 AM and it was perfect.', NOW() - INTERVAL '2 months'),
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), (SELECT id FROM users WHERE username = 'temp_user1'), 5, 'Absolutely mind-blowing! Booked tickets 2 weeks in advance.', NOW() - INTERVAL '1 month'),
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), (SELECT id FROM users WHERE username = 'axis_dev'), 5, 'Sarah''s recommendation was perfect. The morning light through the stained glass is incredible!', NOW() - INTERVAL '1 month'),
((SELECT id FROM recommendations WHERE title = 'Brooklyn Bridge Walk at Sunset'), (SELECT id FROM users WHERE username = 'temp_user2'), 4, 'Beautiful walk but very crowded. Still worth it!', NOW() - INTERVAL '2 weeks');

-- =====================================================
-- 12. ADD LIKES
-- =====================================================
INSERT INTO recommendation_likes (recommendation_id, user_id, created_at) VALUES
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), (SELECT id FROM users WHERE username = 'nexplorer'), NOW() - INTERVAL '3 months'),
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), (SELECT id FROM users WHERE username = 'nexplorer'), NOW() - INTERVAL '3 months'),
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), (SELECT id FROM users WHERE username = 'axis_dev'), NOW() - INTERVAL '2 months'),
((SELECT id FROM recommendations WHERE title = 'Park Güell'), (SELECT id FROM users WHERE username = 'axis_dev'), NOW() - INTERVAL '2 months'),
((SELECT id FROM recommendations WHERE title = 'Musée d''Orsay'), (SELECT id FROM users WHERE username = 'axis_dev'), NOW() - INTERVAL '4 months'),
((SELECT id FROM recommendations WHERE title = 'Brooklyn Bridge Walk at Sunset'), (SELECT id FROM users WHERE username = 'temp_user1'), NOW() - INTERVAL '1 month'),
((SELECT id FROM recommendations WHERE title = 'Joe''s Pizza - Greenwich Village'), (SELECT id FROM users WHERE username = 'temp_user2'), NOW() - INTERVAL '1 month');

-- =====================================================
-- 13. CREATE TRAVEL BUDDY CONNECTION BETWEEN USERS
-- =====================================================
INSERT INTO travel_buddy_connections (requester_id, requested_id, status, request_message, responded_at, created_at) VALUES
((SELECT id FROM users WHERE username = 'axis_dev'), 
    (SELECT id FROM users WHERE username = 'nexplorer'), 
    'accepted',
    'Hey Sarah! Loved your Paris recommendations. Would love to connect and share more travel tips!',
    NOW() - INTERVAL '3 months',
    NOW() - INTERVAL '3 months');

-- =====================================================
-- 14. ADD SOME SAVES
-- =====================================================
INSERT INTO recommendation_saves (recommendation_id, user_id, created_at) VALUES
((SELECT id FROM recommendations WHERE title = 'Tsukiji Outer Market'), (SELECT id FROM users WHERE username = 'nexplorer'), NOW() - INTERVAL '3 months'),
((SELECT id FROM recommendations WHERE title = 'Sagrada Familia Basilica'), (SELECT id FROM users WHERE username = 'axis_dev'), NOW() - INTERVAL '2 months'),
((SELECT id FROM recommendations WHERE title = 'Park Güell'), (SELECT id FROM users WHERE username = 'axis_dev'), NOW() - INTERVAL '2 months'),
((SELECT id FROM recommendations WHERE title = 'teamLab Borderless Digital Art Museum'), (SELECT id FROM users WHERE username = 'temp_user1'), NOW() - INTERVAL '1 month'),
((SELECT id FROM recommendations WHERE title = 'Musée d''Orsay'), (SELECT id FROM users WHERE username = 'temp_user1'), NOW() - INTERVAL '2 months');

-- =====================================================
-- SEED DATA COMPLETE
-- =====================================================
SELECT 'Seed data inserted successfully!' as status;
SELECT 
    COUNT(*) as total_recommendations,
    (SELECT COUNT(*) FROM users WHERE username IN ('axis_dev', 'nexplorer')) as main_users,
    (SELECT COUNT(*) FROM recommendation_photos) as total_photos,
    (SELECT COUNT(*) FROM recommendation_ratings) as total_ratings
FROM recommendations 
WHERE user_id IN (SELECT id FROM users WHERE username IN ('axis_dev', 'nexplorer'));
