-- Add Square integration columns to invoices table
-- Run this in your Supabase SQL Editor

-- Add columns for Square invoice integration
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS square_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS square_payment_url TEXT;

-- Add index for faster lookups by Square invoice ID (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_invoices_square_invoice_id ON invoices(square_invoice_id) WHERE square_invoice_id IS NOT NULL;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'invoices'
AND column_name IN ('square_invoice_id', 'square_payment_url');
