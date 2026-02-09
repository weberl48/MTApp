-- Add rejection_reason column to sessions table
-- Stores the admin's reason when sending a session back for revision
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
