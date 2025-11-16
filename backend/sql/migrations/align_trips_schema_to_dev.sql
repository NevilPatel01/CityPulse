-- =====================================================
-- Migration: Align Trips Schema to Match Development
-- Date: 2025-11-14
-- Purpose: Rename creator_id to user_id and is_public to privacy
-- =====================================================

BEGIN;

-- Check if we need to rename creator_id to user_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trips' AND column_name = 'creator_id') THEN
        
        -- Rename creator_id to user_id
        ALTER TABLE trips RENAME COLUMN creator_id TO user_id;
        RAISE NOTICE 'Renamed creator_id to user_id';
        
        -- Update index name if it exists
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trips_creator_id') THEN
            ALTER INDEX idx_trips_creator_id RENAME TO idx_trips_user_id;
            RAISE NOTICE 'Renamed index idx_trips_creator_id to idx_trips_user_id';
        END IF;
        
    ELSE
        RAISE NOTICE 'Column creator_id does not exist, assuming already renamed';
    END IF;
END$$;

-- Check if we need to convert is_public to privacy
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trips' AND column_name = 'is_public') THEN
        
        -- Add privacy column
        ALTER TABLE trips ADD COLUMN privacy VARCHAR(20);
        
        -- Migrate data: is_public = true -> 'public', is_public = false -> 'buddies_only'
        UPDATE trips SET privacy = CASE 
            WHEN is_public = true THEN 'public'
            ELSE 'buddies_only'
        END;
        
        -- Set default and add constraint
        ALTER TABLE trips ALTER COLUMN privacy SET DEFAULT 'buddies_only';
        ALTER TABLE trips ALTER COLUMN privacy SET NOT NULL;
        ALTER TABLE trips ADD CONSTRAINT trips_privacy_check 
            CHECK (privacy IN ('public', 'buddies_only', 'private'));
        
        -- Drop old column
        ALTER TABLE trips DROP COLUMN is_public;
        
        RAISE NOTICE 'Converted is_public to privacy column';
        
    ELSE
        RAISE NOTICE 'Column is_public does not exist, assuming already converted';
    END IF;
END$$;

-- Add budget columns if they don't exist (using min/max instead of separate columns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trips' AND column_name = 'budget_min') THEN
        
        -- Add total_budget column
        ALTER TABLE trips ADD COLUMN total_budget DECIMAL(10, 2);
        
        -- Migrate data: use budget_max as total_budget (or average of min/max)
        UPDATE trips SET total_budget = COALESCE(budget_max, (budget_min + budget_max) / 2);
        
        -- Drop old columns
        ALTER TABLE trips DROP COLUMN IF EXISTS budget_min;
        ALTER TABLE trips DROP COLUMN IF EXISTS budget_max;
        
        RAISE NOTICE 'Converted budget_min/budget_max to total_budget';
        
    ELSE
        RAISE NOTICE 'Budget columns already in correct format';
    END IF;
END$$;

-- Add is_collaborative column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trips' AND column_name = 'is_collaborative') THEN
        ALTER TABLE trips ADD COLUMN is_collaborative BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_collaborative column';
    ELSE
        RAISE NOTICE 'is_collaborative column already exists';
    END IF;
END$$;

-- Add currency column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trips' AND column_name = 'currency') THEN
        ALTER TABLE trips ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Added currency column';
    ELSE
        RAISE NOTICE 'currency column already exists';
    END IF;
END$$;

-- Remove max_companions column if it exists (not in dev schema)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trips' AND column_name = 'max_companions') THEN
        ALTER TABLE trips DROP COLUMN max_companions;
        RAISE NOTICE 'Removed max_companions column';
    ELSE
        RAISE NOTICE 'max_companions column does not exist';
    END IF;
END$$;

-- Update trip_cities table: add visit_order and notes if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trip_cities' AND column_name = 'visit_order') THEN
        ALTER TABLE trip_cities ADD COLUMN visit_order INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added visit_order column to trip_cities';
    ELSE
        RAISE NOTICE 'visit_order column already exists in trip_cities';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trip_cities' AND column_name = 'notes') THEN
        ALTER TABLE trip_cities ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to trip_cities';
    ELSE
        RAISE NOTICE 'notes column already exists in trip_cities';
    END IF;
END$$;

COMMIT;

-- Verification
SELECT 'Migration completed successfully!' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'trips' 
ORDER BY ordinal_position;
