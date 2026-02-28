-- Add pricing columns to sessions table so group session pricing is persisted
-- Previously, pricing was only stored on session_attendees.individual_cost and invoices,
-- but group sessions have no attendees/invoices, so pricing was lost after save.

ALTER TABLE sessions ADD COLUMN total_amount numeric;
ALTER TABLE sessions ADD COLUMN contractor_pay numeric;
ALTER TABLE sessions ADD COLUMN mca_cut numeric;
