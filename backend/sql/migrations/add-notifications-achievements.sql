-- =====================================================
-- Migration: Add Missing Tables (Notifications, Achievements, User Blocks)
-- Date: 2025-11-14
-- Description: Adds all missing tables required for the application
-- =====================================================

-- =====================================================
-- USER BLOCKS TABLE
-- =====================================================

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
-- ACHIEVEMENTS SYSTEM
-- =====================================================

-- Achievements table
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
-- NOTIFICATIONS SYSTEM
-- =====================================================

-- Notifications table
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
    CHECK (notification_type IN ('buddy_request', 'buddy_accepted', 'buddy_declined', 'recommendation_like', 'recommendation_comment', 'recommendation_rating', 'trip_invite', 'achievement_unlocked', 'system'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User blocks indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_progress ON user_achievements(current_progress);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically update updated_at for user_achievements
DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at 
    BEFORE UPDATE ON user_achievements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default achievements
INSERT INTO achievements (name, description, achievement_type, target_value, badge_icon_url) VALUES
('First Steps', 'Create your first recommendation', 'recommendations_created', 1, '/badges/firststep.webp'),
('City Explorer', 'Visit 5 different cities', 'cities_visited', 5, '/badges/CityExplorer.webp'),
('Social Butterfly', 'Connect with 10 travel buddies', 'travel_buddies_connected', 10, '/badges/SocialButterfly.webp'),
('Review Master', 'Write 20 helpful reviews', 'ratings_received', 20, '/badges/ReviewMaster.webp'),
('Globe Trotter', 'Visit 25 different cities', 'cities_visited', 25, '/badges/GlobeTrotter.webp'),
('Recommendation Pro', 'Create 50 recommendations', 'recommendations_created', 50, '/badges/RecommendationPro.webp'),
('Travel Network Elite', 'Connect with 50 travel buddies', 'travel_buddies_connected', 50, '/badges/TravelNetworkElite.webp'),
('Trusted Advisor', 'Provide 100 helpful reviews', 'ratings_received', 100, '/badges/TrustedAdvisor.webp'),
('Rising Star', 'Receive 25 likes on your recommendations', 'likes_received', 25, '/badges/RisingStar.webp'),
('Crowd Favorite', 'Receive 100 likes on your recommendations', 'likes_received', 100, '/badges/CrowdFavorite.webp')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 
    'achievements' as table_name, 
    COUNT(*) as record_count 
FROM achievements
UNION ALL
SELECT 
    'notifications' as table_name, 
    COUNT(*) as record_count 
FROM notifications
UNION ALL
SELECT 
    'user_achievements' as table_name, 
    COUNT(*) as record_count 
FROM user_achievements;
