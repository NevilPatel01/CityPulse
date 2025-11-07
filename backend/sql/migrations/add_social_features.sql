-- Migration: Add Social Features for Dashboard
-- Description: Adds bookmarks, shares, reports, and user interests tables
-- Date: 2025-11-04
-- Note: Comments feature will be added in future iteration

-- ============================================================================
-- 1. BOOKMARKS/SAVED RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendation_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recommendation_id)
);

CREATE INDEX idx_bookmarks_user ON recommendation_bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_recommendation ON recommendation_bookmarks(recommendation_id);

-- ============================================================================
-- 2. SHARES TABLE (Track share count)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendation_shares (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_platform VARCHAR(50), -- 'twitter', 'facebook', 'whatsapp', 'copy_link', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shares_recommendation ON recommendation_shares(recommendation_id);
CREATE INDEX idx_shares_user ON recommendation_shares(user_id);

-- Add shares count column to recommendations
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- ============================================================================
-- 3. REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recommendation_reports (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_reason VARCHAR(50) NOT NULL CHECK (report_reason IN ('spam', 'inappropriate', 'misleading', 'offensive', 'copyright', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reporter_id, recommendation_id) -- One report per user per recommendation
);

CREATE INDEX idx_reports_recommendation ON recommendation_reports(recommendation_id);
CREATE INDEX idx_reports_status ON recommendation_reports(status, created_at DESC);

-- ============================================================================
-- 4. USER INTERESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_interests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES recommendation_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id)
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_user_interests_category ON user_interests(category_id);

-- ============================================================================
-- 5. ADD LOCATION TO USER PROFILES (if not exists)
-- ============================================================================
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_city_id INTEGER REFERENCES cities(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- ============================================================================
-- 6. FUNCTIONS TO UPDATE COUNTS
-- ============================================================================

-- Update shares count trigger
CREATE OR REPLACE FUNCTION update_recommendation_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recommendations 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.recommendation_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shares_count
AFTER INSERT ON recommendation_shares
FOR EACH ROW EXECUTE FUNCTION update_recommendation_shares_count();

-- ============================================================================
-- 7. INITIALIZE COUNTS FOR EXISTING RECOMMENDATIONS
-- ============================================================================
UPDATE recommendations r
SET shares_count = (
    SELECT COUNT(*) 
    FROM recommendation_shares s 
    WHERE s.recommendation_id = r.id
);

-- ============================================================================
-- COMPLETED
-- ============================================================================
