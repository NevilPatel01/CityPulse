-- Add twitter_url column to user_profiles table
-- This migration adds support for Twitter/X profile links

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN user_profiles.twitter_url IS 'User Twitter/X profile URL (supports both twitter.com and x.com domains)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_twitter_url ON user_profiles(twitter_url) WHERE twitter_url IS NOT NULL;
