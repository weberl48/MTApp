-- Add scholarship_rate column to service_types
-- This is a flat dollar amount charged for scholarship sessions (e.g., $60)
-- When set, overrides the percentage-based scholarship_discount_percentage
-- Contractor still gets their normal (non-scholarship) pay; MCA absorbs the difference
ALTER TABLE service_types ADD COLUMN scholarship_rate DECIMAL(10,2) DEFAULT NULL;
