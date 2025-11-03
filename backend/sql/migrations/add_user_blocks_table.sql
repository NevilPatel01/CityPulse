-- Migration: Add user_blocks table for Travel Buddy System
-- Date: 2025-11-02
-- Description: Create user_blocks table to manage blocked users

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker 
ON user_blocks(blocker_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked 
ON user_blocks(blocked_id);

-- Create composite index for checking if user A blocked user B
CREATE INDEX IF NOT EXISTS idx_user_blocks_check 
ON user_blocks(blocker_id, blocked_id);

COMMENT ON TABLE user_blocks IS 'Stores user blocking relationships';
COMMENT ON COLUMN user_blocks.blocker_id IS 'User who initiated the block';
COMMENT ON COLUMN user_blocks.blocked_id IS 'User who is blocked';
