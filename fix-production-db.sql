-- =====================================================
-- CityPulse Production Database Fixes
-- Run this via SSH on the production server
-- =====================================================

-- First, connect to the database container:
-- docker exec -it citypulse-db psql -U citypulse_user -d citypulse_prod

-- =====================================================
-- 1. FIX BOOKMARK TABLE NAME MISMATCH
-- =====================================================
-- The controller expects 'recommendation_bookmarks' but schema has 'recommendation_saves'
-- Option 1: Rename the table (recommended to match controller expectations)

ALTER TABLE IF EXISTS recommendation_saves RENAME TO recommendation_bookmarks;

-- If the table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS recommendation_bookmarks (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recommendation_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_recommendation_bookmarks_user_id ON recommendation_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_bookmarks_recommendation_id ON recommendation_bookmarks(recommendation_id);

-- =====================================================
-- 2. ENSURE NOTIFICATIONS TABLE EXISTS
-- =====================================================

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

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- =====================================================
-- 2.5. EMAIL PREFERENCES TABLE
-- =====================================================

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

-- Create index for email preferences
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- =====================================================
-- 3. ENSURE TRIPS TABLES EXIST
-- =====================================================

-- Main trips table
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

-- Trip Cities
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

-- Trip Companions
CREATE TABLE IF NOT EXISTS trip_companions (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('organizer', 'participant')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(trip_id, user_id)
);

-- Trip Itinerary
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

-- Trip Recommendations
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

-- Trip Comments
CREATE TABLE IF NOT EXISTS trip_comments (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES FOR TRIPS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_privacy ON trips(privacy);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_trip_cities_trip_id ON trip_cities(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_cities_city_id ON trip_cities(city_id);

CREATE INDEX IF NOT EXISTS idx_trip_companions_trip_id ON trip_companions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_companions_user_id ON trip_companions(user_id);

CREATE INDEX IF NOT EXISTS idx_trip_itinerary_trip_id ON trip_itinerary(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_recommendations_trip_id ON trip_recommendations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_trip_id ON trip_comments(trip_id);

-- =====================================================
-- 5. VERIFY TABLES EXIST
-- =====================================================

-- Run this to verify all tables are created:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN (
    'recommendation_bookmarks',
    'notifications',
    'email_preferences',
    'trips', 
    'trip_cities', 
    'trip_companions', 
    'trip_itinerary',
    'trip_recommendations',
    'trip_comments'
) ORDER BY tablename;