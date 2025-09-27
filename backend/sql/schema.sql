-- CityPulse - Travel Social Network Database Schema
-- Complete database schema with all required tables for stats, badges, and functionality

-- =====================================================
-- 1. CREATE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. USER MANAGEMENT & AUTHENTICATION
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    current_location VARCHAR(100),
    hometown VARCHAR(100),
    phone VARCHAR(20),
    is_google_user BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(100) UNIQUE,
    role VARCHAR(20) DEFAULT 'user',
    account_status VARCHAR(20) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    security_code VARCHAR(6) NOT NULL,
    reset_token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    profile_photo_url VARCHAR(255),
    cover_photo_url VARCHAR(255),
    instagram_url VARCHAR(255),
    facebook_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    whatsapp_contact VARCHAR(50),
    website_url VARCHAR(255),
    cities_visited JSONB DEFAULT '[]'::JSONB,
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    location_sharing BOOLEAN DEFAULT TRUE,
    social_links_visible BOOLEAN DEFAULT TRUE,
    travel_buddy_requests_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel Preferences
CREATE TABLE IF NOT EXISTS travel_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    travel_style VARCHAR(50),
    activity_level VARCHAR(20),
    preferred_difficulty VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INTERESTS & CATEGORIES
-- =====================================================

-- Interest Categories
CREATE TABLE IF NOT EXISTS interest_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Interests
CREATE TABLE IF NOT EXISTS user_interests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_category_id INTEGER NOT NULL REFERENCES interest_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, interest_category_id)
);

-- =====================================================
-- 4. LOCATION & GEOGRAPHY
-- =====================================================

-- Cities
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50),
    cover_image_url VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User City Visits (for stats)
CREATE TABLE IF NOT EXISTS user_city_visits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    visit_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, city_id)
);

-- =====================================================
-- 5. RECOMMENDATIONS SYSTEM
-- =====================================================

-- Recommendation Categories
CREATE TABLE IF NOT EXISTS recommendation_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations (for stats)
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES recommendation_categories(id) ON DELETE CASCADE,
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    difficulty_level VARCHAR(20),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    best_time_to_visit VARCHAR(100),
    duration_suggestion VARCHAR(50),
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    status VARCHAR(20) DEFAULT 'active',
    report_reason TEXT,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation Cities
CREATE TABLE IF NOT EXISTS recommendation_cities (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recommendation_id, city_id)
);

-- =====================================================
-- 6. TAGS & MEDIA FOR RECOMMENDATIONS
-- =====================================================

-- Recommendation Tags
CREATE TABLE IF NOT EXISTS recommendation_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation Tag Links
CREATE TABLE IF NOT EXISTS recommendation_tag_links (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES recommendation_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recommendation_id, tag_id)
);

-- Recommendation Photos
CREATE TABLE IF NOT EXISTS recommendation_photos (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    photo_url VARCHAR(255) NOT NULL,
    caption TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. RATINGS & INTERACTIONS
-- =====================================================

-- Recommendation Ratings
CREATE TABLE IF NOT EXISTS recommendation_ratings (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recommendation_id, user_id)
);

-- Recommendation Likes
CREATE TABLE IF NOT EXISTS recommendation_likes (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recommendation_id, user_id)
);

-- User Favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recommendation_id)
);

-- =====================================================
-- 8. SOCIAL CONNECTIONS & TRAVEL BUDDIES
-- =====================================================

-- Travel Buddy Connections (for stats)
CREATE TABLE IF NOT EXISTS travel_buddy_connections (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    request_message TEXT,
    response_message TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, requested_id)
);

-- =====================================================
-- 9. TRIP PLANNING & MANAGEMENT
-- =====================================================

-- Trips
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    max_companions INTEGER,
    status VARCHAR(20) DEFAULT 'planning',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip Cities
CREATE TABLE IF NOT EXISTS trip_cities (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    arrival_date DATE,
    departure_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, city_id)
);

-- Trip Companions
CREATE TABLE IF NOT EXISTS trip_companions (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'invited',
    role VARCHAR(20) DEFAULT 'companion',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Trip Itinerary
CREATE TABLE IF NOT EXISTS trip_itinerary (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    recommendation_id INTEGER REFERENCES recommendations(id) ON DELETE SET NULL,
    day_number INTEGER NOT NULL,
    time_slot VARCHAR(20),
    custom_activity VARCHAR(200),
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. GAMIFICATION & ACHIEVEMENTS
-- =====================================================

-- Achievements (for badges)
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    badge_icon_url VARCHAR(255),
    achievement_type VARCHAR(50),
    target_value INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements (for badges)
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- 11. SEARCH & PERSONALIZATION
-- =====================================================

-- Search History
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_query VARCHAR(255) NOT NULL,
    filters_applied JSONB,
    results_count INTEGER,
    clicked_result_id INTEGER REFERENCES recommendations(id) ON DELETE SET NULL,
    search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_name VARCHAR(100) NOT NULL,
    search_query VARCHAR(255) NOT NULL,
    filters_applied JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. NOTIFICATIONS SYSTEM
-- =====================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),
    related_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 13. MODERATION & CONTENT SAFETY
-- =====================================================

-- Moderator Actions
CREATE TABLE IF NOT EXISTS moderator_actions (
    id SERIAL PRIMARY KEY,
    moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50),
    target_type VARCHAR(50),
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Warnings
CREATE TABLE IF NOT EXISTS user_warnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    warning_type VARCHAR(50),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Reports
CREATE TABLE IF NOT EXISTS content_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_content_type VARCHAR(50),
    reported_content_id INTEGER NOT NULL,
    report_reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 14. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Password reset tokens indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_security_code ON password_reset_tokens(security_code);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_reset_token ON password_reset_tokens(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_visibility ON user_profiles(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Cities indexes
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);
CREATE INDEX IF NOT EXISTS idx_cities_location ON cities(latitude, longitude);

-- User city visits indexes (for stats)
CREATE INDEX IF NOT EXISTS idx_user_city_visits_user_id ON user_city_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_city_visits_city_id ON user_city_visits(city_id);
CREATE INDEX IF NOT EXISTS idx_user_city_visits_visit_date ON user_city_visits(visit_date);

-- Recommendations indexes (for stats)
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_category_id ON recommendations(category_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_location ON recommendations(latitude, longitude);

-- Travel buddy connections indexes (for stats)
CREATE INDEX IF NOT EXISTS idx_travel_buddy_connections_requester ON travel_buddy_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_travel_buddy_connections_requested ON travel_buddy_connections(requested_id);
CREATE INDEX IF NOT EXISTS idx_travel_buddy_connections_status ON travel_buddy_connections(status);

-- User achievements indexes (for badges)
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);

-- =====================================================
-- 15. CREATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 16. CREATE TRIGGERS
-- =====================================================

-- Trigger to automatically update updated_at for users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for travel_preferences
DROP TRIGGER IF EXISTS update_travel_preferences_updated_at ON travel_preferences;
CREATE TRIGGER update_travel_preferences_updated_at 
    BEFORE UPDATE ON travel_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for cities
DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at 
    BEFORE UPDATE ON cities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for recommendations
DROP TRIGGER IF EXISTS update_recommendations_updated_at ON recommendations;
CREATE TRIGGER update_recommendations_updated_at 
    BEFORE UPDATE ON recommendations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for recommendation_ratings
DROP TRIGGER IF EXISTS update_recommendation_ratings_updated_at ON recommendation_ratings;
CREATE TRIGGER update_recommendation_ratings_updated_at 
    BEFORE UPDATE ON recommendation_ratings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for trips
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at 
    BEFORE UPDATE ON trips 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for trip_itinerary
DROP TRIGGER IF EXISTS update_trip_itinerary_updated_at ON trip_itinerary;
CREATE TRIGGER update_trip_itinerary_updated_at 
    BEFORE UPDATE ON trip_itinerary 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for user_achievements
DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at 
    BEFORE UPDATE ON user_achievements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for saved_searches
DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at 
    BEFORE UPDATE ON saved_searches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 17. INSERT INITIAL DATA
-- =====================================================

-- Insert default achievement categories
INSERT INTO achievements (name, description, achievement_type, target_value, badge_icon_url) VALUES
('First Steps', 'Create your first recommendation', 'recommendations_created', 1, '/icons/first-steps.svg'),
('City Explorer', 'Visit 5 different cities', 'cities_visited', 5, '/icons/city-explorer.svg'),
('Social Butterfly', 'Connect with 10 travel buddies', 'travel_buddies_connected', 10, '/icons/social-butterfly.svg'),
('Review Master', 'Write 20 helpful reviews', 'ratings_received', 20, '/icons/review-master.svg'),
('Globe Trotter', 'Visit 25 different cities', 'cities_visited', 25, '/icons/globe-trotter.svg'),
('Recommendation Pro', 'Create 50 recommendations', 'recommendations_created', 50, '/icons/recommendation-pro.svg')
ON CONFLICT (name) DO NOTHING;

-- Insert default interest categories
INSERT INTO interest_categories (name, description, icon_url) VALUES
('Adventure', 'Outdoor activities and adventure sports', '/icons/adventure.svg'),
('Culture', 'Museums, historical sites, and cultural experiences', '/icons/culture.svg'),
('Food & Dining', 'Restaurants, cafes, and culinary experiences', '/icons/food.svg'),
('Nightlife', 'Bars, clubs, and evening entertainment', '/icons/nightlife.svg'),
('Nature', 'Parks, beaches, and natural attractions', '/icons/nature.svg'),
('Shopping', 'Markets, malls, and shopping districts', '/icons/shopping.svg'),
('Photography', 'Scenic spots and photo opportunities', '/icons/photography.svg'),
('Relaxation', 'Spas, wellness, and peaceful activities', '/icons/relaxation.svg')
ON CONFLICT (name) DO NOTHING;

-- Insert default recommendation categories
INSERT INTO recommendation_categories (name, description, icon_url) VALUES
('Restaurant', 'Places to eat and drink', '/icons/restaurant.svg'),
('Attraction', 'Tourist attractions and landmarks', '/icons/attraction.svg'),
('Activity', 'Things to do and experiences', '/icons/activity.svg'),
('Accommodation', 'Hotels, hostels, and places to stay', '/icons/accommodation.svg'),
('Transportation', 'Getting around and travel options', '/icons/transportation.svg'),
('Shopping', 'Places to shop and buy souvenirs', '/icons/shopping.svg'),
('Entertainment', 'Shows, events, and entertainment venues', '/icons/entertainment.svg'),
('Nature', 'Parks, beaches, and outdoor spaces', '/icons/nature.svg')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 18. GRANT PERMISSIONS
-- =====================================================

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE citypulse_dev TO user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO user;

-- =====================================================
-- 19. VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 'Database schema creation completed successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
