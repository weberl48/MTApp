-- ============================================================================
-- Hotfix — 2026-07-04: restore missing PHI-sanitization helper functions
-- ============================================================================
-- APPLY BY HAND via the Supabase SQL editor (this project is not `supabase link`ed).
-- Idempotent: safe to re-run. Run top-to-bottom.
-- STATUS: APPLIED to prod 2026-07-04 via the Supabase Management API query
-- endpoint; verified (helpers present, sanitize smoke test OK, audited write OK).
--
-- WHY: 20260702_audit_remediation.sql restored the sanitizing
-- audit_trigger_function(), which calls sanitize_phi_jsonb(). That migration
-- assumed the helpers from sanitize-phi-in-audit-logs.sql were already present
-- on the live DB — they were not (that older migration was never applied by
-- hand). Result: every INSERT/UPDATE/DELETE on any audited table (sessions,
-- invoices, clients, users, service_types, organizations, session_attendees,
-- contractor_rates, client_goals, user_invites, client_access_tokens,
-- session_requests, client_resources) fails with:
--   function sanitize_phi_jsonb(jsonb) does not exist
-- First observed on scholarship batch generation (invoices INSERT), but the
-- breakage is global. This migration creates the helpers, pinned search_path.
-- ============================================================================


-- Field names to hash in audit logs. Superset of every prior definition:
-- 20260209 added invited_email + token; 20260702 added group_member_names but
-- dropped invited_email — restore both. Over-hashing is harmless; under-hashing
-- leaks PHI/credentials into audit_logs.
CREATE OR REPLACE FUNCTION get_phi_fields()
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    RETURN ARRAY[
        'notes',
        'client_notes',
        'description',        -- client_goals.description
        'contact_email',
        'contact_phone',
        'group_member_names',
        'invited_email',      -- user_invites.invited_email
        'token'               -- user_invites.token / client_access_tokens.token
    ];
END;
$$;

-- Short hash for audit change-detection (not cryptographic — MD5 is fine here).
CREATE OR REPLACE FUNCTION hash_for_audit(value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    IF value IS NULL OR value = '' THEN
        RETURN NULL;
    END IF;
    RETURN 'hash:' || LEFT(MD5(value), 16);
END;
$$;

-- Replace PHI field values in a JSONB row image with hashes.
CREATE OR REPLACE FUNCTION sanitize_phi_jsonb(data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    phi_fields TEXT[];
    field TEXT;
    result JSONB;
BEGIN
    IF data IS NULL THEN
        RETURN NULL;
    END IF;

    phi_fields := get_phi_fields();
    result := data;

    FOREACH field IN ARRAY phi_fields LOOP
        IF result ? field AND result->>field IS NOT NULL AND result->>field != '' THEN
            result := jsonb_set(result, ARRAY[field], to_jsonb(hash_for_audit(result->>field)));
        END IF;
    END LOOP;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION sanitize_phi_jsonb IS 'Replaces PHI field values with hashes for audit log storage. Maintains change detection capability without storing sensitive data.';
COMMENT ON FUNCTION hash_for_audit IS 'Creates a short hash of text for audit purposes. Uses MD5 prefix for change detection, not security.';


-- ============================================================================
-- VERIFICATION (run separately after applying)
-- ============================================================================
-- 1. Helpers exist:
--    SELECT proname FROM pg_proc WHERE proname IN ('get_phi_fields','hash_for_audit','sanitize_phi_jsonb');
--    -- expect all 3 rows
-- 2. Sanitization works end-to-end:
--    SELECT sanitize_phi_jsonb('{"notes":"secret","name":"ok"}'::jsonb);
--    -- expect {"name": "ok", "notes": "hash:..."}
-- 3. Audited writes work again (smoke test): re-run "Generate All" on the
--    invoices Scholarship tab, or update any client and confirm no error.
-- ============================================================================
