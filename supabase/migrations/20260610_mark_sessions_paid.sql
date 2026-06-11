-- Atomically mark a set of sessions paid for payroll.
--
-- The Payroll Hub looped client-side, updating sessions one at a time with no
-- contractor_paid_date guard — a failure mid-loop left some paid and some not (and a retry could
-- pay twice). This function updates the whole set in ONE statement, sets contractor_paid_date and
-- snapshots contractor_paid_amount from each session's own contractor_pay, and only touches
-- sessions that aren't already paid. Returns how many were actually marked.
--
-- SECURITY INVOKER (default): RLS still applies, so a caller can only mark sessions in their org.
CREATE OR REPLACE FUNCTION mark_sessions_paid(p_ids uuid[], p_paid_date date)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE sessions
  SET contractor_paid_date = p_paid_date,
      contractor_paid_amount = contractor_pay,
      updated_at = now()
  WHERE id = ANY(p_ids)
    AND contractor_paid_date IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
