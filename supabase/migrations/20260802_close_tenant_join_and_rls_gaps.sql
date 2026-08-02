-- ============================================================================
-- Security audit 2026-08-02 — close the self-service tenant-join path and the
-- two RLS gaps that turned it into a PHI read.
--
-- APPLY TO CERT FIRST, VERIFY, THEN PROD (see CLAUDE.md). Migrations in this
-- repo are applied BY HAND — there is no schema_migrations table.
--
-- Supersedes the org-join half of 20260801_harden_handle_new_user.sql. That
-- migration's adoption logic (same id -> adopt, same email different id ->
-- actionable error) is preserved verbatim below; only the org-resolution block
-- changes. Apply 20260801 first, or apply this one alone — it is a complete
-- CREATE OR REPLACE either way.
--
-- THE HOLE
-- handle_new_user() is SECURITY DEFINER and read the target organization from
-- NEW.raw_user_meta_data, which is the `options.data` blob of a browser
-- supabase.auth.signUp() call — entirely attacker-controlled. Anyone who knew an
-- organization's UUID could sign up straight into that tenant as a contractor,
-- with no invite. The signup UI even asked for it, labelled "invite code", so
-- the UUID circulated by email and could never be rotated.
--
-- From inside the tenant, reading PHI is a single query. Verified against the
-- LIVE cert database on 2026-08-02:
--
--   clients      "Users can view clients in org"  SELECT  USING (organization_id = get_user_organization_id())
--   client_goals "Users can view goals in org"    SELECT  USING (organization_id = get_user_organization_id())
--
-- Neither carries a role check, so any member of the organization — including a
-- contractor who just signed themselves in — can SELECT every client row: name,
-- contact_email, phone, notes.
--
-- NOTE FOR ANYONE READING THE MIGRATION FOLDER: 20241212_restrict_contractor_client_access.sql
-- appears to have narrowed `clients` to "clients you have had a session with",
-- and supabase/schema.sql appears to show the permissive version as legacy. Both
-- readings are wrong. That migration was NEVER APPLIED — the live database still
-- has the original permissive policy and has no "Contractors can view own clients"
-- policy at all. Migrations here are applied by hand with no schema_migrations
-- table, so the folder is a record of intent, not of state. Check pg_policies.
--
-- This migration therefore cuts the chain at step 0 — no unauthorized member —
-- and does NOT change who inside the org can read clients or goals. See the
-- "deliberately not changed" note at the bottom.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Joining an existing organization now REQUIRES a valid invite token.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    org_id UUID;
    new_user_role user_role;
    invite_token TEXT;
    invite_org_id UUID;
    invite_role user_role;
    invite_email TEXT;
    invite_expires TIMESTAMPTZ;
    invite_used_at TIMESTAMPTZ;
BEGIN
    -- Adoption check FIRST.
    --
    -- A pre-existing team member is being given a login at their own id (the
    -- supported recovery for the historical session-import rows). Their profile
    -- already carries the right role, org and history — adopt it untouched.
    --
    -- This ran AFTER org resolution in 20260801, which meant the recovery flow
    -- (no invite token, no org metadata) fell into the create-a-new-practice
    -- branch, INSERTed an organization, and only then discovered it had nothing
    -- to do with it — leaking an empty org row on every recovery. Checking here
    -- costs one indexed lookup and makes the no-op case a genuine no-op.
    IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Secure invite token is now the ONLY way into an existing organization.
    invite_token := NEW.raw_user_meta_data->>'invite_token';

    IF invite_token IS NOT NULL AND invite_token <> '' THEN
        SELECT organization_id, role, invited_email, expires_at, used_at
        INTO invite_org_id, invite_role, invite_email, invite_expires, invite_used_at
        FROM public.user_invites
        WHERE token = invite_token;

        IF invite_org_id IS NOT NULL
           AND invite_used_at IS NULL
           AND invite_expires > NOW()
           AND (invite_email IS NULL OR LOWER(invite_email) = LOWER(NEW.email)) THEN

            org_id := invite_org_id;
            new_user_role := invite_role;

            UPDATE public.user_invites
            SET used_at = NOW(), used_by = NEW.id
            WHERE token = invite_token;
        ELSE
            -- An invite token was presented and did not validate (unknown, used,
            -- expired, or issued to a different address). Previously this fell
            -- through and silently created a brand-new organization with the
            -- signer-up as its admin, which reads to the user as "it worked".
            RAISE EXCEPTION
                'This invitation link is no longer valid. Ask your practice administrator to send a new one.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;

    IF org_id IS NULL THEN
        -- No invite token at all. Self-serve CREATION of a new practice stays
        -- open; JOINING an existing one does not.
        --
        -- raw_user_meta_data is attacker-controlled, so an organization_id
        -- supplied there is an assertion of intent, never an authorization.
        -- Honouring it was the tenant-join hole.
        IF NULLIF(NEW.raw_user_meta_data->>'organization_id', '') IS NOT NULL THEN
            RAISE EXCEPTION
                'Joining an existing organization requires a valid invitation link.'
                USING ERRCODE = 'insufficient_privilege';
        END IF;

        INSERT INTO public.organizations (name, slug)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'organization_name', split_part(NEW.email, '@', 1) || '''s Practice'),
            COALESCE(NEW.raw_user_meta_data->>'organization_slug', replace(lower(split_part(NEW.email, '@', 1)), '.', '-') || '-' || substr(gen_random_uuid()::text, 1, 8))
        )
        RETURNING id INTO org_id;

        -- Keep legacy behavior: new org creator becomes admin
        new_user_role := 'admin';
    END IF;

    -- Same person's email under a different id. Inserting would violate
    -- users_email_key anyway; raising here makes the reason legible instead of
    -- surfacing as an opaque "Database error saving new user".
    IF EXISTS (SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(NEW.email)) THEN
        RAISE EXCEPTION
            'A profile already exists for % under a different id. Create the auth user at that existing public.users id so their sessions and rates stay attached.',
            NEW.email
            USING ERRCODE = 'unique_violation';
    END IF;

    -- `role` is deliberately NOT read from raw_user_meta_data. It comes from the
    -- invite row or from the create-your-own-practice branch, never from the
    -- browser.
    INSERT INTO public.users (id, email, name, role, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(new_user_role, 'contractor'),
        org_id
    );

    RETURN NEW;
END;
$function$;


-- ----------------------------------------------------------------------------
-- 2. Make role and organization_id immutable in the POLICY, not only the trigger.
--
-- 20260702_audit_remediation.sql added prevent_user_privilege_escalation() to
-- stop a self-UPDATE rewriting role/organization_id. That trigger is correct and
-- stays, but it is the ONLY thing standing between an authenticated user and
-- `UPDATE users SET role='developer' WHERE id = auth.uid()` — the underlying
-- policy has no WITH CHECK at all. Drop a trigger by accident and the hole is
-- back, silently. This adds the second lock.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (id = (select auth.uid()))
    WITH CHECK (
        id = (select auth.uid())
        AND role = (SELECT u.role FROM users u WHERE u.id = (select auth.uid()))
        AND organization_id = (SELECT u.organization_id FROM users u WHERE u.id = (select auth.uid()))
    );

COMMENT ON POLICY "Users can update own profile" ON users IS
    'WITH CHECK pins role and organization_id to their current values. Belt to prevent_user_privilege_escalation()''s braces (security audit 2026-08-02).';


-- ----------------------------------------------------------------------------
-- DELIBERATELY NOT CHANGED: org-wide SELECT on `clients` and `client_goals`
--
-- Every member of an organization, contractor included, can read every client
-- row and every goal in that organization. This migration does not touch that,
-- for two reasons:
--
--   1. It is not the vulnerability. The vulnerability was that an outsider could
--      MAKE THEMSELVES a member. Once section 1 closes that, org-wide reads are
--      a product decision about what a contractor should see — the owner's call,
--      not a security patch's.
--
--   2. Narrowing it is not a safe drive-by. 20241212_restrict_contractor_client_access.sql
--      would restrict `clients` to "clients you have had a session with", and it
--      has been sitting unapplied for eight months. Applying it now would very
--      likely break the session form's client picker for contractors: a
--      contractor logging a FIRST session with a new client could no longer see
--      that client to select them. That needs its own change, with the picker
--      reworked and tested — not a line in a security migration.
--
-- If the owner does want contractors limited to their own clients, do it as a
-- dedicated change covering clients + client_goals + the picker together.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- VERIFY:
--
--   -- 1. the trigger no longer reads an org id out of user metadata
--   SELECT position('organization_id' in prosrc) = 0 AS org_metadata_removed
--   FROM pg_proc WHERE proname = 'handle_new_user';
--
--   -- 2. the users UPDATE policy now carries a WITH CHECK
--   SELECT with_check FROM pg_policies
--   WHERE tablename = 'users' AND policyname = 'Users can update own profile';
--
--   -- 3. as a plain authenticated user, this must fail with 42501
--   UPDATE users SET role = 'owner' WHERE id = auth.uid();
--
--   -- 4. from a signed-out browser, this must now raise rather than create a user
--   supabase.auth.signUp({ email, password,
--     options: { data: { organization_id: '<any org uuid>' } } })
-- ----------------------------------------------------------------------------
