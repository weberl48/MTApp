-- Add group_contractor_pay JSONB field to service_types
-- Maps "{headcount}_{duration}" keys to contractor pay amounts
-- Example: {"1_30": 40, "2_30": 49, "3_30": 63, "4_30": 77, "5_30": 91, "6_30": 105}
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS group_contractor_pay JSONB DEFAULT NULL;
