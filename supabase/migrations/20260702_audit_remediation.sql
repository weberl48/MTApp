-- ============================================================================
-- Audit Remediation — 2026-07-02
-- ============================================================================
-- Fixes the database-layer findings from the July 2026 security audit.
-- APPLY BY HAND via the Supabase SQL editor (this project is not `supabase link`ed).
-- Idempotent: safe to re-run. Run top-to-bottom.
--
-- IMPORTANT: This migration is paired with application code changes (role changes
-- now route through the `updateUserRole` server action using the service role, and
-- `mark_sessions_paid` is called by staff only). Apply this migration and deploy the
-- code together — the users trigger below blocks browser-side role/org edits, so the
-- server action MUST be live or admins cannot change roles.
--
-- Covered findings:
--   P0  users self-UPDATE privilege escalation / tenant hop
--   P1  session_status missing 'cancelled' enum value
--   P1  client-resources storage bucket RLS not org-scoped (cross-tenant PHI read)
--   P1  audit-log PHI sanitization silently reverted
--   P1  contractor draft-session edit/resubmit RLS-denied
--   P2  session_attendees SELECT org-wide (contractor client enumeration)
--   P2  contractors can mint portal tokens for any client
--   P2  mark_sessions_paid callable by any authenticated user
--   P2  login_attempts anon INSERT -> unauthenticated lockout DoS
--   P3  mark_sessions_paid / claim_invoice_reminder_day mutable search_path
-- ============================================================================


-- ----------------------------------------------------------------------------
-- P1 — Add the missing 'cancelled' session status.
-- cancelSession() writes 'cancelled' but no migration ever added it, so the write
-- throws AFTER pending invoices are deleted. ADD VALUE is transaction-safe in PG12+
-- as long as the value isn't used in the same transaction (it isn't here).
-- ----------------------------------------------------------------------------
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'cancelled';


-- ----------------------------------------------------------------------------
-- P0 — Block privilege escalation / tenant hop via self-UPDATE on `users`.
-- The "Users can update own profile" policy is FOR UPDATE USING (id = auth.uid())
-- with no WITH CHECK and no column restriction, so an authenticated user can rewrite
-- their own `role` (-> developer, full cross-org access) or `organization_id`.
-- A BEFORE UPDATE trigger makes role/organization_id immutable for everyone EXCEPT
-- the service role. Legitimate role management now goes through the `updateUserRole`
-- server action, which uses the service client after an explicit permission check.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_user_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Server-side code using the service key may change anything (it does its own authz).
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Changing role is not permitted' USING ERRCODE = '42501';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'Changing organization is not permitted' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_privilege_escalation ON users;
CREATE TRIGGER prevent_user_privilege_escalation
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_user_privilege_escalation();


-- ----------------------------------------------------------------------------
-- P1 — Org-scope the `client-resources` storage bucket policies.
-- The staff policies checked only `role IN (...)` with no org/path check, letting any
-- authenticated staff member of ANY org download another tenant's client files. Paths
-- are `organization_id/clientId/timestamp_filename`, so foldername[1] is the org id.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can upload client resources" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view client resources" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete client resources" ON storage.objects;

CREATE POLICY "Staff can upload client resources"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'client-resources'
    AND (storage.foldername(name))[1] = (select get_user_organization_id())::text
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = (select auth.uid())
          AND role IN ('admin', 'owner', 'developer', 'contractor')
    )
);

CREATE POLICY "Staff can view client resources"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'client-resources'
    AND (storage.foldername(name))[1] = (select get_user_organization_id())::text
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = (select auth.uid())
          AND role IN ('admin', 'owner', 'developer', 'contractor')
    )
);

CREATE POLICY "Staff can delete client resources"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'client-resources'
    AND (storage.foldername(name))[1] = (select get_user_organization_id())::text
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = (select auth.uid())
          AND role IN ('admin', 'owner', 'developer')
    )
);


-- ----------------------------------------------------------------------------
-- P1 — Restore PHI sanitization in the audit trigger.
-- 20250202_fix_function_search_path.sql redefined audit_trigger_function() to store
-- raw old/new JSON, silently reverting sanitize-phi-in-audit-logs.sql (so audit_logs
-- captured raw contact_email/phone, group_member_names, and user_invites.token — the
-- last enabling owner-invite-token harvest -> owner escalation). This restores the
-- sanitizing definition and pins search_path.
-- (get_phi_fields / hash_for_audit / sanitize_phi_jsonb are unchanged and assumed present.)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    audit_user_id UUID;
    audit_user_email TEXT;
    audit_org_id UUID;
    changed TEXT[];
    old_json JSONB;
    new_json JSONB;
    old_sanitized JSONB;
    new_sanitized JSONB;
    col TEXT;
BEGIN
    audit_user_id := auth.uid();

    SELECT email INTO audit_user_email
    FROM auth.users
    WHERE id = audit_user_id;

    IF TG_OP = 'DELETE' THEN
        old_json := to_jsonb(OLD);
        new_json := NULL;
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (OLD).id;
        ELSE
            audit_org_id := COALESCE(
                old_json->>'organization_id',
                (SELECT organization_id::text FROM users WHERE id = audit_user_id)
            )::UUID;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        old_json := NULL;
        new_json := to_jsonb(NEW);
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (NEW).id;
        ELSE
            audit_org_id := COALESCE(
                new_json->>'organization_id',
                (SELECT organization_id::text FROM users WHERE id = audit_user_id)
            )::UUID;
        END IF;
    ELSE -- UPDATE
        old_json := to_jsonb(OLD);
        new_json := to_jsonb(NEW);
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (NEW).id;
        ELSE
            audit_org_id := COALESCE(
                new_json->>'organization_id',
                (SELECT organization_id::text FROM users WHERE id = audit_user_id)
            )::UUID;
        END IF;

        changed := ARRAY[]::TEXT[];
        FOR col IN SELECT key FROM jsonb_object_keys(new_json) AS key
        LOOP
            IF old_json->col IS DISTINCT FROM new_json->col THEN
                changed := array_append(changed, col);
            END IF;
        END LOOP;
    END IF;

    -- Sanitize PHI fields before storing.
    old_sanitized := sanitize_phi_jsonb(old_json);
    new_sanitized := sanitize_phi_jsonb(new_json);

    INSERT INTO audit_logs (
        organization_id, table_name, record_id, action,
        old_data, new_data, changed_fields, user_id, user_email
    ) VALUES (
        audit_org_id, TG_TABLE_NAME, COALESCE((NEW).id, (OLD).id), TG_OP::audit_action,
        old_sanitized, new_sanitized, changed, audit_user_id, audit_user_email
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- user_invites.token is a bearer credential; ensure it is treated as PHI-grade and hashed.
CREATE OR REPLACE FUNCTION get_phi_fields()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY[
        'notes',
        'client_notes',
        'description',      -- client_goals.description
        'contact_email',
        'contact_phone',
        'group_member_names',
        'token'             -- user_invites.token / client_access_tokens.token
    ];
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ----------------------------------------------------------------------------
-- P1 — Let contractors submit their own draft sessions (and re-submit after a
-- rejection). The policy had no WITH CHECK, so the USING (status='draft') also
-- constrained the NEW row, blocking draft->submitted. Allow the transition to
-- 'submitted' (never 'approved'). Also give contractors DELETE on their own
-- session's attendees so the edit form's delete-then-insert isn't a silent no-op
-- that then trips the UNIQUE(session_id, client_id) constraint.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Contractors can update own draft sessions" ON sessions;
CREATE POLICY "Contractors can update own draft sessions" ON sessions
    FOR UPDATE
    USING (
        contractor_id = (select auth.uid())
        AND status = 'draft'
    )
    WITH CHECK (
        contractor_id = (select auth.uid())
        AND status IN ('draft', 'submitted')
    );

DROP POLICY IF EXISTS "Contractors can delete own draft attendees" ON session_attendees;
CREATE POLICY "Contractors can delete own draft attendees" ON session_attendees
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
              AND s.contractor_id = (select auth.uid())
              AND s.status = 'draft'
        )
    );


-- ----------------------------------------------------------------------------
-- P2 — Scope session_attendees SELECT: a contractor should see attendees only for
-- their OWN sessions; admins/owners/developers see all in the org. The prior policy
-- OR'd in `s.organization_id = get_user_organization_id()`, exposing every client_id
-- and individual_cost in the org to any contractor.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "View attendees for accessible sessions in org" ON session_attendees;
CREATE POLICY "View attendees for accessible sessions in org" ON session_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND (
                s.contractor_id = (select auth.uid())
                OR EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = (select auth.uid())
                      AND u.organization_id = s.organization_id
                      AND u.role IN ('admin', 'owner', 'developer')
                )
            )
        )
    );


-- ----------------------------------------------------------------------------
-- P2 — Only admins/owners/developers may mint client portal access tokens.
-- The INSERT policy included 'contractor' with no linkage to clients the contractor
-- may access, so a contractor could INSERT a token row for ANY client in the org and
-- read that client's portal data. Portal-invite generation is a staff/admin action.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can create access tokens" ON client_access_tokens;
CREATE POLICY "Staff can create access tokens" ON client_access_tokens
    FOR INSERT WITH CHECK (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = (select auth.uid())
              AND role IN ('admin', 'owner', 'developer')
        )
    );


-- ----------------------------------------------------------------------------
-- P2 — login_attempts: drop the anon INSERT policy. The app only ever records
-- attempts via the service role (which bypasses RLS), so this WITH CHECK(true) policy
-- is vestigial and lets anyone with the public anon key flood attempts to lock a
-- victim's account out at will.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON login_attempts;


-- ----------------------------------------------------------------------------
-- P2/P3 — mark_sessions_paid: add a staff-role check and pin search_path.
-- SECURITY INVOKER means RLS scopes the UPDATE to the caller's org, but a contractor
-- could still RPC it against their OWN draft sessions and corrupt payroll. Require an
-- admin/owner/developer caller.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_sessions_paid(p_ids uuid[], p_paid_date date)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('admin', 'owner', 'developer')
  ) THEN
    RAISE EXCEPTION 'Not authorized to mark sessions paid' USING ERRCODE = '42501';
  END IF;

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


-- ----------------------------------------------------------------------------
-- P3 — claim_invoice_reminder_day: pin search_path (behavior unchanged).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_invoice_reminder_day(p_invoice_id uuid, p_day int)
RETURNS boolean
LANGUAGE sql
SET search_path = public
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


-- ============================================================================
-- VERIFICATION (run separately after applying; all should return the expected value)
-- ============================================================================
-- 1. 'cancelled' present:
--    SELECT unnest(enum_range(NULL::session_status));               -- expect draft,submitted,approved,no_show,cancelled
-- 2. users escalation trigger present:
--    SELECT tgname FROM pg_trigger WHERE tgname = 'prevent_user_privilege_escalation';
-- 3. storage policies org-scoped:
--    SELECT policyname, qual FROM pg_policies
--    WHERE tablename='objects' AND policyname LIKE '%client resources%';   -- qual must mention foldername
-- 4. audit sanitization live:
--    SELECT pg_get_functiondef('audit_trigger_function()'::regprocedure) LIKE '%sanitize_phi_jsonb%';  -- expect t
-- 5. login_attempts anon insert gone:
--    SELECT count(*) FROM pg_policies WHERE tablename='login_attempts' AND policyname='Anyone can insert login attempts'; -- expect 0
-- ============================================================================
