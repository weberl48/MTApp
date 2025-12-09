-- Add developer role with full platform access
-- =============================================

-- Add 'developer' to the user_role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'developer' AND enumtypid = 'user_role'::regtype) THEN
        ALTER TYPE user_role ADD VALUE 'developer';
    END IF;
END $$;

-- Note: The above ALTER TYPE must be committed before using the new value.
-- Run this migration, then run the UPDATE below separately if needed.
