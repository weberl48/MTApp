-- Migration: Add contractor_rates table and pay_increase column
-- Purpose: Enable per-contractor-per-service pricing (different contractors can earn different amounts for same service)

-- Add pay_increase column to users table for per-session contractor bonus
ALTER TABLE users ADD COLUMN IF NOT EXISTS pay_increase DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN users.pay_increase IS
    'Per-session pay increase for this contractor (e.g., Colleen gets +$2 per session)';

-- Create contractor_rates table for custom per-contractor-per-service pricing
CREATE TABLE IF NOT EXISTS contractor_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
    contractor_pay DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(contractor_id, service_type_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contractor_rates_contractor ON contractor_rates(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_rates_service ON contractor_rates(service_type_id);

-- Enable RLS
ALTER TABLE contractor_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Admins/Owners/Developers can manage all contractor rates
CREATE POLICY "Admins can manage contractor rates" ON contractor_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('developer', 'owner', 'admin')
        )
    );

-- Policy: Contractors can view their own rates only
CREATE POLICY "Contractors can view own rates" ON contractor_rates
    FOR SELECT USING (contractor_id = auth.uid());

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contractor_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contractor_rates_updated_at ON contractor_rates;
CREATE TRIGGER contractor_rates_updated_at
    BEFORE UPDATE ON contractor_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_contractor_rates_updated_at();

-- Add group session fields to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS group_headcount INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS group_member_names TEXT;

COMMENT ON COLUMN sessions.group_headcount IS
    'Number of people in group session (used for billing calculation)';
COMMENT ON COLUMN sessions.group_member_names IS
    'Freetext list of group member names (for groups not tracked as individual clients)';
