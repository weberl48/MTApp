-- Track processed Square webhook event IDs so retried/replayed deliveries are ignored.
--
-- Square retries webhook deliveries and can send duplicate/overlapping events (e.g. both
-- invoice.payment_made and payment.completed for one payment). Without dedupe, each delivery
-- re-ran the handler — re-sending the owner "Payment Received" email and re-applying status.
-- The webhook inserts each event_id here first; a unique-violation means it was already
-- processed and the handler returns early.
CREATE TABLE IF NOT EXISTS square_webhook_events (
  event_id text PRIMARY KEY,
  event_type text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Only the webhook (service role, which bypasses RLS) writes this table. Enable RLS with no
-- policies so it is not readable/writable by normal authenticated clients.
ALTER TABLE square_webhook_events ENABLE ROW LEVEL SECURITY;
