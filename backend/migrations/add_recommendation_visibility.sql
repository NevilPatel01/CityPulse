-- Migration: Add visibility column to recommendations table
-- This enables public/private/friends-only content visibility controls

-- Add visibility column with default 'public' for existing recommendations
ALTER TABLE recommendations 
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public' 
CHECK (visibility IN ('public', 'private', 'friends_only'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_recommendations_visibility ON recommendations(visibility);

-- Create index for combined user_id and visibility queries
CREATE INDEX IF NOT EXISTS idx_recommendations_user_visibility ON recommendations(user_id, visibility);

-- Update existing recommendations to be public by default
UPDATE recommendations 
SET visibility = 'public' 
WHERE visibility IS NULL;

COMMENT ON COLUMN recommendations.visibility IS 'Controls who can see this recommendation: public (everyone), private (only owner), friends_only (owner and buddies)';
