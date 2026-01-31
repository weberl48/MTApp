-- Add Venmo to payment_method enum
-- This allows tracking payments received via Venmo

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'venmo';

COMMENT ON TYPE payment_method IS 'Payment methods: private_pay, self_directed, group_home, scholarship, venmo';
