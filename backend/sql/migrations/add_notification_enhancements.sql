-- Migration: Add notification enhancements for Travel Buddy System
-- Date: 2025-11-02
-- Description: Add related_user_id and action_url columns to notifications table

-- Add related_user_id column (references the user who triggered the notification)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS related_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Add action_url column (link to the relevant page)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_url VARCHAR(255);

-- Add index for related_user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_related_user 
ON notifications(related_user_id);

-- Add constraint for notification_type if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'notifications_notification_type_check'
    ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_notification_type_check 
        CHECK (notification_type IN (
            'buddy_request',
            'buddy_accepted',
            'buddy_declined',
            'recommendation_like',
            'recommendation_comment',
            'recommendation_rating',
            'trip_invite',
            'achievement_unlocked',
            'system'
        ));
    END IF;
END $$;

-- Create indexes for better notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(notification_type);

COMMENT ON COLUMN notifications.related_user_id IS 'The user who triggered this notification (e.g., who sent the buddy request)';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
