-- Clear contractor_pay_schedule on ALL service types so proportional scaling
-- (rate × duration/30) takes effect universally.
-- Contractors' 30-min base rate is preserved in contractor_rates.contractor_pay.
UPDATE service_types
SET contractor_pay_schedule = NULL
WHERE contractor_pay_schedule IS NOT NULL;

-- Clear explicit duration_increment on ALL contractor_rates
-- so the proportional formula is used instead of fixed increments.
UPDATE contractor_rates
SET duration_increment = NULL
WHERE duration_increment IS NOT NULL;
