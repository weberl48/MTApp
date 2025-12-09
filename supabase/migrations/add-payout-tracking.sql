-- Add contractor payout tracking columns to sessions table
-- Run this migration to enable the Payroll Hub feature

-- Add columns for tracking when contractors get paid
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contractor_paid_date DATE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS contractor_paid_amount DECIMAL(10,2);

-- Create an index for efficient queries on unpaid sessions
CREATE INDEX IF NOT EXISTS idx_sessions_contractor_paid ON sessions(contractor_id, contractor_paid_date);

-- Comment on new columns
COMMENT ON COLUMN sessions.contractor_paid_date IS 'Date when the contractor was paid for this session';
COMMENT ON COLUMN sessions.contractor_paid_amount IS 'Amount paid to contractor for this session';
