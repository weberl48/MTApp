-- Add total_cap to service_types for capping the total billed amount per session
-- (independent of contractor_cap which caps contractor pay)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS total_cap DECIMAL(10,2) DEFAULT NULL;
