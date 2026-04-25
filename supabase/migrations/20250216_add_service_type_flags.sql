-- Add is_scholarship flag for service types that should be batch-invoiced monthly
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS is_scholarship boolean NOT NULL DEFAULT false;

-- Add requires_client flag for service types that don't need a client (e.g., admin work)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS requires_client boolean NOT NULL DEFAULT true;

-- Add allowed_contractor_ids to restrict which contractors can use a service type
-- NULL or empty array means no restriction (all contractors can use it)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS allowed_contractor_ids text[] DEFAULT NULL;
