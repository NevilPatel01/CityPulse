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
    deactivated_at TIMESTAMP WITH TIME ZONE,
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
    twitter_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    whatsapp_contact VARCHAR(50),
    website_url VARCHAR(255),
    cities_visited JSONB DEFAULT '[]'::JSONB,
    current_city_id INTEGER, -- Will be constrained later after cities table is created
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
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
-- 3. LOCATION & GEOGRAPHY (moved earlier for dependencies)
-- =====================================================

-- Cities (moved before user_profiles due to foreign key reference)
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

-- Add foreign key constraint for user_profiles.current_city_id after cities table exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_current_city_id_fkey'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_current_city_id_fkey 
        FOREIGN KEY (current_city_id) REFERENCES cities(id);
    END IF;
END $$;

-- =====================================================
-- 4. RECOMMENDATIONS SYSTEM (moved earlier for dependencies)
-- =====================================================

-- Recommendation Categories (moved before user_interests due to foreign key reference)
CREATE TABLE IF NOT EXISTS recommendation_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INTERESTS & CATEGORIES
-- =====================================================

-- User Interests (links users to recommendation categories they're interested in)
CREATE TABLE IF NOT EXISTS user_interests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES recommendation_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category_id)
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
-- 6. RECOMMENDATIONS (continued)
-- =====================================================

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
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends_only')),
    report_reason TEXT,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
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
-- 7. TAGS & MEDIA FOR RECOMMENDATIONS
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
-- 8. RATINGS & INTERACTIONS
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

-- Recommendation Views (track who viewed what)
CREATE TABLE IF NOT EXISTS recommendation_views (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation Saves (track who saved what)
CREATE TABLE IF NOT EXISTS recommendation_saves (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recommendation_id)
);

-- =====================================================
-- 9. SOCIAL CONNECTIONS & TRAVEL BUDDIES
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
    UNIQUE(requester_id, requested_id),
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

-- User Blocks
CREATE TABLE IF NOT EXISTS user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100),
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- =====================================================
-- 9. TRIP PLANNING & MANAGEMENT (OLD - TO BE REPLACED BY WEEK 9)
-- (This section will be replaced by the Week 9 comprehensive trip planning system below)
-- =====================================================

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
    related_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    CHECK (notification_type IN ('buddy_request', 'buddy_accepted', 'buddy_declined', 'recommendation_like', 'recommendation_comment', 'recommendation_rating', 'trip_invite', 'trip_accepted', 'trip_removed', 'achievement_unlocked', 'system'))
);

-- =====================================================
-- 12.1 EMAIL VERIFICATION & PREFERENCES
-- =====================================================

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Preferences
CREATE TABLE IF NOT EXISTS email_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    buddy_requests BOOLEAN DEFAULT TRUE,
    recommendations BOOLEAN DEFAULT TRUE,
    trips BOOLEAN DEFAULT TRUE,
    achievements BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT FALSE,
    marketing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12.2 SOCIAL SHARING
-- =====================================================

-- Recommendation Shares (Track share count)
CREATE TABLE IF NOT EXISTS recommendation_shares (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_platform VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_recommendations_visibility ON recommendations(visibility);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_visibility ON recommendations(user_id, visibility);

-- User interests indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_category_id ON user_interests(category_id);

-- Email verification tokens indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Email preferences indexes
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Recommendation shares indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_shares_recommendation_id ON recommendation_shares(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_shares_user_id ON recommendation_shares(user_id);

-- Travel buddy connections indexes (for stats)
CREATE INDEX IF NOT EXISTS idx_travel_buddy_connections_requester ON travel_buddy_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_travel_buddy_connections_requested ON travel_buddy_connections(requested_id);
CREATE INDEX IF NOT EXISTS idx_travel_buddy_connections_status ON travel_buddy_connections(status);

-- User blocks indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- Recommendation views indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_views_recommendation_id ON recommendation_views(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_views_user_id ON recommendation_views(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_views_viewed_at ON recommendation_views(viewed_at);

-- Recommendation saves indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_saves_recommendation_id ON recommendation_saves(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_saves_user_id ON recommendation_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_saves_created_at ON recommendation_saves(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Content reports indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON content_reports(reported_content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_id ON content_reports(reported_content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_status_created ON content_reports(status, created_at DESC);

-- Moderator actions indexes
CREATE INDEX IF NOT EXISTS idx_moderator_actions_moderator_id ON moderator_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderator_actions_target_type ON moderator_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_moderator_actions_created_at ON moderator_actions(created_at DESC);

-- User warnings indexes
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_moderator_id ON user_warnings(moderator_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_is_active ON user_warnings(is_active);
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_active ON user_warnings(user_id, is_active);

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

-- Trigger to automatically update updated_at for email_preferences
DROP TRIGGER IF EXISTS update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER update_email_preferences_updated_at 
    BEFORE UPDATE ON email_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update shares count on recommendations
CREATE OR REPLACE FUNCTION update_recommendation_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recommendations 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.recommendation_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update shares_count when a share is recorded
DROP TRIGGER IF EXISTS trigger_update_shares_count ON recommendation_shares;
CREATE TRIGGER trigger_update_shares_count
    AFTER INSERT ON recommendation_shares
    FOR EACH ROW 
    EXECUTE FUNCTION update_recommendation_shares_count();

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
-- Insert all achievements with correct badge image URLs
INSERT INTO achievements (name, description, achievement_type, target_value, badge_icon_url) VALUES
-- Main achievements
('First Steps', 'Create your first recommendation', 'recommendations_created', 1, '/badges/firststep.webp'),
('City Explorer', 'Visit 5 different cities', 'cities_visited', 5, '/badges/CityExplorer.webp'),
('Social Butterfly', 'Connect with 10 travel buddies', 'travel_buddies_connected', 10, '/badges/SocialButterfly.webp'),
('Review Master', 'Write 20 helpful reviews', 'ratings_received', 20, '/badges/ReviewMaster.webp'),
('Globe Trotter', 'Visit 25 different cities', 'cities_visited', 25, '/badges/GlobeTrotter.webp'),
('Recommendation Pro', 'Create 50 recommendations', 'recommendations_created', 50, '/badges/RecommendationPro.webp'),
-- Additional achievements
('Rising Star', 'Receive 25 likes on your recommendations', 'likes_received', 25, '/badges/RisingStar.webp'),
('Crowd Favorite', 'Receive 100 likes on your recommendations', 'likes_received', 100, '/badges/CrowdFavorite.webp'),
('Travel Network Elite', 'Connect with 50 travel buddies', 'travel_buddies_connected', 50, '/badges/TravelNetworkElite.webp'),
('Trusted Advisor', 'Receive 100 ratings on your recommendations', 'ratings_received', 100, '/badges/TrustedAdvisor.webp'),
-- Tier-based badges
('Bronze Achiever', 'Complete your first bronze tier achievement', 'special', 1, '/badges/Bronze.webp'),
('Silver Achiever', 'Complete your first silver tier achievement', 'special', 1, '/badges/silver.webp'),
('Gold Achiever', 'Complete your first gold tier achievement', 'special', 1, '/badges/gold.webp'),
('Platinum Achiever', 'Complete your first platinum tier achievement', 'special', 1, '/badges/Platinum.webp')
ON CONFLICT (name) DO UPDATE 
SET badge_icon_url = EXCLUDED.badge_icon_url;

-- Insert default interest categories
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
-- Final database grants
GRANT ALL PRIVILEGES ON DATABASE citypulse_dev TO "citypulse_user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "citypulse_user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "citypulse_user";

-- =====================================================
-- 19.TRIP PLANNING SYSTEM
-- =====================================================

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
    privacy VARCHAR(20) DEFAULT 'buddies_only' CHECK (privacy IN ('public', 'buddies_only', 'private')),
    cover_photo_url VARCHAR(255),
    is_collaborative BOOLEAN DEFAULT FALSE,
    total_budget DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip Cities (cities to visit in a trip)
CREATE TABLE IF NOT EXISTS trip_cities (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    arrival_date DATE,
    departure_date DATE,
    visit_order INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, city_id)
);

-- Trip Companions (users participating in the trip)
CREATE TABLE IF NOT EXISTS trip_companions (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('organizer', 'participant')),
    status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'removed')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(trip_id, user_id)
);

-- Trip Itinerary (daily activities/schedule)
CREATE TABLE IF NOT EXISTS trip_itinerary (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    trip_city_id INTEGER REFERENCES trip_cities(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    activity_date DATE,
    time_slot TIME,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50),
    duration_minutes INTEGER,
    estimated_cost DECIMAL(10, 2),
    location_name VARCHAR(255),
    location_coordinates POINT,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    added_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip Recommendations (link recommendations to trip itinerary)
CREATE TABLE IF NOT EXISTS trip_recommendations (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    itinerary_id INTEGER REFERENCES trip_itinerary(id) ON DELETE CASCADE,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'confirmed', 'visited')),
    added_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, recommendation_id)
);

-- Trip Comments (discussion/notes on trips)
CREATE TABLE IF NOT EXISTS trip_comments (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR TRIP SYSTEM
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_privacy ON trips(privacy);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_trip_cities_trip_id ON trip_cities(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_cities_city_id ON trip_cities(city_id);
CREATE INDEX IF NOT EXISTS idx_trip_cities_dates ON trip_cities(arrival_date, departure_date);

CREATE INDEX IF NOT EXISTS idx_trip_companions_trip_id ON trip_companions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_companions_user_id ON trip_companions(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_companions_status ON trip_companions(status);

CREATE INDEX IF NOT EXISTS idx_trip_itinerary_trip_id ON trip_itinerary(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_itinerary_city_id ON trip_itinerary(trip_city_id);
CREATE INDEX IF NOT EXISTS idx_trip_itinerary_date ON trip_itinerary(activity_date);

CREATE INDEX IF NOT EXISTS idx_trip_recommendations_trip_id ON trip_recommendations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_recommendations_rec_id ON trip_recommendations(recommendation_id);

CREATE INDEX IF NOT EXISTS idx_trip_comments_trip_id ON trip_comments(trip_id);

-- =====================================================
-- 20. VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 'Database schema creation completed successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
