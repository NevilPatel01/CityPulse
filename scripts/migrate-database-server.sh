#!/bin/bash

# =====================================================
# Server Database Migration Script
# Run this on the server to add missing tables
# =====================================================

echo "🔧 Starting database migration..."

# Check if running on server
if [ ! -f /.dockerenv ] && [ ! -S /var/run/docker.sock ]; then
    echo "⚠️  This should be run on the production server!"
    echo "📋 Copy this script to your server and run it there"
    exit 1
fi

# Create migration SQL file
cat > /tmp/add-notifications-achievements.sql << 'EOF'
-- =====================================================
-- Migration: Add Notifications and Achievements Tables
-- Date: 2025-11-14
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

-- User Achievements
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Trigger for user_achievements
DROP TRIGGER IF EXISTS update_user_achievements_updated_at ON user_achievements;
CREATE TRIGGER update_user_achievements_updated_at 
    BEFORE UPDATE ON user_achievements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Seed achievements
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
EOF

echo "📝 Migration SQL file created"

# Find the postgres container
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container not found!"
    echo "📋 Looking for containers..."
    docker ps
    exit 1
fi

echo "🐘 Found PostgreSQL container: $POSTGRES_CONTAINER"

# Execute the migration
echo "🚀 Executing migration..."
docker exec -i $POSTGRES_CONTAINER psql -U citypulse -d citypulse < /tmp/add-notifications-achievements.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    
    # Verify tables
    echo ""
    echo "📊 Verifying tables..."
    docker exec $POSTGRES_CONTAINER psql -U citypulse -d citypulse -c "
        SELECT 
            table_name,
            (SELECT COUNT(*) FROM achievements) as achievement_count,
            (SELECT COUNT(*) FROM notifications) as notification_count,
            (SELECT COUNT(*) FROM user_achievements) as user_achievement_count
        FROM information_schema.tables 
        WHERE table_schema='public' 
        AND table_name IN ('achievements', 'notifications', 'user_achievements')
        ORDER BY table_name;
    "
    
    echo ""
    echo "🎉 Database migration complete!"
    echo "🔄 You may need to restart the backend container for changes to take effect"
else
    echo "❌ Migration failed!"
    exit 1
fi

# Cleanup
rm -f /tmp/add-notifications-achievements.sql
