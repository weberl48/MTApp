-- Atomically "claim" an invoice reminder day so each reminder is sent at most once, even under
-- cron retries or overlapping runs.
--
-- The cron previously read reminder_sent_days, sent the email, then wrote [...arr, day] — a
-- non-atomic read-modify-write whose write was unchecked. A lost write made the overdue notice
-- re-qualify and re-send EVERY day, and two overlapping runs could both send. This function
-- appends the day only if it isn't already present, in a single atomic UPDATE, and returns true
-- only when it actually added it. The cron sends the email only when it gets the claim.
--
-- `p_day` is the reminder marker: a positive number of days-before-due (e.g. 7, 1) or -1 for the
-- overdue notice.
CREATE OR REPLACE FUNCTION claim_invoice_reminder_day(p_invoice_id uuid, p_day int)
RETURNS boolean
LANGUAGE sql
AS $$
  WITH updated AS (
    UPDATE invoices
    SET reminder_sent_days = COALESCE(reminder_sent_days, '[]'::jsonb) || to_jsonb(p_day)
    WHERE id = p_invoice_id
      AND NOT (COALESCE(reminder_sent_days, '[]'::jsonb) @> to_jsonb(p_day))
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM updated);
$$;
