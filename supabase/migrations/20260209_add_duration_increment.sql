-- Add per-contractor duration increment to contractor_rates
-- Stores $/15-min step for durations beyond 30 min
-- NULL = use the service type's default increment (derived from contractor_pay_schedule)
ALTER TABLE contractor_rates
ADD COLUMN IF NOT EXISTS duration_increment DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN contractor_rates.duration_increment IS
  'Per-15-minute pay increment for durations beyond 30 min. NULL = use service type default from contractor_pay_schedule.';
