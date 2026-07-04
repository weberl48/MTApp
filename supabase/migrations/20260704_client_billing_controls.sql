-- ============================================================================
-- Client billing controls + session status timestamps — 2026-07-04
-- ============================================================================
-- APPLY BY HAND via the Supabase SQL editor or Management API (project is not
-- `supabase link`ed). Idempotent: safe to re-run. Run top-to-bottom.
-- STATUS: APPLIED to prod 2026-07-04 via Management API; verified (columns,
-- trigger, backfill 0 gaps).
--
-- Owner-requested features:
--   1. Per-client end-of-month batch invoicing (clients.billing_frequency)
--   2. Per-client automatic Square processing fee (clients.square_fee_enabled)
--      with per-invoice override (invoices.apply_square_fee, tri-state)
--   3. Invoice sorting by Date Submitted / Date Approved
--      (sessions.submitted_at / approved_at, trigger-maintained + backfilled)
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Per-client billing frequency.
--    'per_session' (default) = invoice generated on approval as today.
--    'monthly' = per-session invoices are skipped; sessions batch into one
--    monthly invoice per client (same flow as scholarship, normal pricing).
-- ----------------------------------------------------------------------------
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_frequency TEXT NOT NULL DEFAULT 'per_session'
  CHECK (billing_frequency IN ('per_session', 'monthly'));

-- ----------------------------------------------------------------------------
-- 2. Per-client Square processing fee opt-in + per-invoice override.
--    clients.square_fee_enabled: this client's invoices get the org-configured
--    Square processing fee even when the org-wide toggle is off.
--    invoices.apply_square_fee: NULL = follow org setting; true/false = explicit
--    per-invoice decision (snapshotted from the client at generation, editable
--    on the invoice until it has been sent to Square).
-- ----------------------------------------------------------------------------
ALTER TABLE clients ADD COLUMN IF NOT EXISTS square_fee_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS apply_square_fee BOOLEAN;

-- ----------------------------------------------------------------------------
-- 3. Session status timestamps, maintained by trigger so every write path
--    (session form, quick log, approve/bulk approve, session requests) is
--    covered without app-code coordination.
-- ----------------------------------------------------------------------------
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION set_session_status_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'submitted' AND NEW.submitted_at IS NULL THEN
      NEW.submitted_at := now();
    END IF;
    IF NEW.status = 'approved' THEN
      NEW.submitted_at := COALESCE(NEW.submitted_at, now());
      NEW.approved_at := COALESCE(NEW.approved_at, now());
    END IF;
  ELSE
    IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
      NEW.submitted_at := now();
    END IF;
    IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
      NEW.approved_at := now();
      NEW.submitted_at := COALESCE(NEW.submitted_at, OLD.submitted_at, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_session_status_timestamps ON sessions;
CREATE TRIGGER set_session_status_timestamps
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_session_status_timestamps();

-- Backfill from audit logs (earliest observed transition to each status).
UPDATE sessions s SET submitted_at = b.at
FROM (
  SELECT record_id, MIN(created_at) AS at
  FROM audit_logs
  WHERE table_name = 'sessions' AND (new_data->>'status') = 'submitted'
  GROUP BY record_id
) b
WHERE s.id = b.record_id AND s.submitted_at IS NULL;

UPDATE sessions s SET approved_at = b.at
FROM (
  SELECT record_id, MIN(created_at) AS at
  FROM audit_logs
  WHERE table_name = 'sessions' AND (new_data->>'status') = 'approved'
  GROUP BY record_id
) b
WHERE s.id = b.record_id AND s.approved_at IS NULL;

-- Sessions predating audit coverage: approximate with row timestamps.
UPDATE sessions SET submitted_at = created_at
WHERE submitted_at IS NULL AND status IN ('submitted', 'approved');
UPDATE sessions SET approved_at = updated_at
WHERE approved_at IS NULL AND status = 'approved';


-- ============================================================================
-- VERIFICATION (run separately after applying)
-- ============================================================================
-- 1. Columns exist:
--    SELECT column_name FROM information_schema.columns WHERE table_name='clients'
--      AND column_name IN ('billing_frequency','square_fee_enabled');          -- 2 rows
--    SELECT column_name FROM information_schema.columns WHERE table_name='invoices'
--      AND column_name='apply_square_fee';                                     -- 1 row
--    SELECT column_name FROM information_schema.columns WHERE table_name='sessions'
--      AND column_name IN ('submitted_at','approved_at');                      -- 2 rows
-- 2. Trigger present:
--    SELECT tgname FROM pg_trigger WHERE tgname='set_session_status_timestamps';
-- 3. Backfill coverage:
--    SELECT status, count(*) FILTER (WHERE submitted_at IS NULL) AS no_sub,
--           count(*) FILTER (WHERE approved_at IS NULL) AS no_appr, count(*)
--    FROM sessions GROUP BY status;   -- submitted/approved rows should have timestamps
-- ============================================================================
