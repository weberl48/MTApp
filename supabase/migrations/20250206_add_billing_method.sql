-- Add billing_method column to clients table
-- Controls how invoices are sent: 'square' (auto-send via Square), 'check', 'email', 'other'
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS billing_method TEXT NOT NULL DEFAULT 'square';

-- Set existing clients with a square_customer_id to 'square' (already the default)
-- Set existing clients without a square_customer_id to 'other' so they don't get auto-sent
UPDATE clients
SET billing_method = 'other'
WHERE square_customer_id IS NULL;
