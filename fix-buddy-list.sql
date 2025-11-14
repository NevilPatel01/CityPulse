-- =====================================================
-- Fix Find Buddies Feature - Missing Table and Column
-- =====================================================

-- 1. Add missing columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS action_url VARCHAR(255);

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_notifications_related_user_id ON notifications(related_user_id);

-- 2. Drop and recreate user_blocks table with correct column names
DROP TABLE IF EXISTS user_blocks CASCADE;

CREATE TABLE user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- Create indexes for user_blocks
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);

-- Verify the changes
\echo 'Checking notifications table structure...'
\d notifications

\echo 'Checking user_blocks table...'
\d user_blocks

\echo 'All fixes applied successfully!'
