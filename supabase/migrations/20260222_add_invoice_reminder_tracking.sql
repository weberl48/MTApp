-- Add reminder tracking to invoices table
-- Stores which reminder days have already been sent (e.g., [7, 1] after both 7-day and 1-day reminders fire)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_sent_days JSONB DEFAULT '[]'::jsonb;
