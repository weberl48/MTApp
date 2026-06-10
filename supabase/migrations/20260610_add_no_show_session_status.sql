-- Add the 'no_show' value to the session_status enum.
--
-- Without it, markSessionNoShow (which writes status='no_show') fails at runtime with
-- "invalid input value for enum session_status". With it, marking a session no-show works
-- and the application reprices the linked pending invoice to the org's no_show_fee while the
-- contractor keeps their normal pay (see calculateNoShowPricing).
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block. Run this statement
-- on its own (the Supabase SQL editor does this by default).
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'no_show';
