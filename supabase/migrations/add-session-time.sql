-- Add time field to sessions table
-- This allows tracking the specific time of day a session occurs

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS time TIME DEFAULT '09:00:00';

-- Add comment explaining the field
COMMENT ON COLUMN sessions.time IS 'Time of day the session starts (e.g., 14:30:00 for 2:30 PM)';

-- Note: Existing sessions will default to 9:00 AM
-- The session form will allow users to set the actual time
