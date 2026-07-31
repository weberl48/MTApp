-- ============================================================================
-- Owner-only contractor pay rates + organization settings writes
-- 2026-07-31
--
-- Two policies let admins reach owner-only data directly, regardless of what
-- the UI renders:
--
--   1. contractor_rates "Admins can manage contractor rates" (FOR ALL, admin
--      included) — the app now hides every rate surface behind the
--      `team:view-rates` permission (developer/owner), but an admin could still
--      read or write the table from the browser client.
--
--   2. organizations "Admins can update organization" (FOR UPDATE, admin
--      included) — the whole settings blob is one JSONB column, so this let an
--      admin flip `security.require_mfa`, owner-only feature flags, portal token
--      expiry or automation with a single client-side call, even though the UI
--      shows them none of those tabs. Admin-legitimate sections (invoice,
--      session, notification, custom_lists, pricing) now go through the
--      `updateOrganizationSettings` server action, which enforces the section
--      allow-list in src/lib/organization/settings.ts and writes with the
--      service role.
--
-- NOTE: supabase/schema.sql still shows the ORIGINAL owner-only organizations
-- policy; the admin-inclusive one shipped in 20250202_fix_rls_performance.sql.
-- The live database is authoritative — this migration returns it to owner-only.
--
-- Apply by hand (SQL editor or Management API): CERT FIRST, verify, then prod.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. contractor_rates — developer/owner only.
--    "Contractors can view own rates" is left untouched: contractors must still
--    see their own pay in Earnings and the session form.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage contractor rates" ON contractor_rates;

CREATE POLICY "Owners can manage contractor rates" ON contractor_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = (select auth.uid())
            AND role IN ('developer', 'owner')
        )
    );

-- ----------------------------------------------------------------------------
-- 2. organizations — drop the admin-inclusive UPDATE policy.
--    Owners keep direct updates (branding/practice settings write the org row
--    from the browser); admin settings edits route through the server action,
--    which uses the service role and bypasses RLS after its own authz.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;

CREATE POLICY "Owners can update own organization" ON organizations
    FOR UPDATE USING (
        id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = (select auth.uid())
            AND role IN ('owner', 'developer')
        )
    );

-- ----------------------------------------------------------------------------
-- Verification (expect: no policy on either table whose role list includes
-- 'admin'; contractor self-read and the developer policies still present).
-- ----------------------------------------------------------------------------
-- select tablename, policyname, cmd,
--        (coalesce(qual,'') || coalesce(with_check,'')) ilike '%''admin''%' as includes_admin
-- from pg_policies
-- where tablename in ('organizations','contractor_rates')
-- order by tablename, policyname;
