-- Add contractor_pay_schedule to service_types
-- Stores explicit contractor base pay per duration: { "30": 38.50, "45": 53.00 }
-- When set, replaces linear duration scaling for contractor pay calculation
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS contractor_pay_schedule JSONB DEFAULT NULL;
