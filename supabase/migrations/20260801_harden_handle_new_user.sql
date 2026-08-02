-- Make handle_new_user() adopt a pre-existing public.users row instead of
-- failing the signup outright.
--
-- WHY
-- The historical session-import created public.users rows for team members who
-- had never signed up (as of 2026-08-01: 8 of 11 people in production, every
-- contractor plus the admin). public.users.email is UNIQUE and this trigger
-- ended in a plain INSERT of NEW.email, so when one of those people accepted an
-- invite the INSERT raised 23505, which aborted the whole GoTrue signup
-- transaction. The only symptom the person saw was an opaque "Database error
-- saving new user", and no account was ever created.
--
-- WHAT CHANGES
-- The trigger now checks for an existing profile before inserting:
--   * same id  -> adopt it and do nothing. This is the supported recovery:
--                 create the auth.users row AT the person's existing
--                 public.users id, which keeps their sessions,
--                 contractor_rates and role attached.
--   * same email, DIFFERENT id -> still fails, but now with an actionable
--                 message telling the operator to reuse the existing id.
--                 Silently skipping would leave an auth user with no profile,
--                 so they could log in to a broken app with no error trail;
--                 silently inserting would detach them from their history.
--   * neither -> insert as before.
--
-- NOT "ON CONFLICT (id) DO NOTHING" — that was tried on cert 2026-08-01 and does
-- NOT work. The orphan row collides on BOTH id and email, and Postgres raises on
-- users_email_key first, which an id-targeted ON CONFLICT does not catch. Verified:
-- admin-creating an auth user at the matching id still returned
-- 23505 "duplicate key value violates unique constraint users_email_key".
--
-- Everything above the final INSERT is unchanged from the previous definition.

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
    -- Prefer secure invite token if present
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
        END IF;
    END IF;

    -- Fall back to legacy org join/create
    IF org_id IS NULL THEN
        -- Check if organization is specified in metadata
        org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;

        IF org_id IS NULL THEN
            -- Create a new organization for this user
            INSERT INTO public.organizations (name, slug)
            VALUES (
                COALESCE(NEW.raw_user_meta_data->>'organization_name', split_part(NEW.email, '@', 1) || '''s Practice'),
                COALESCE(NEW.raw_user_meta_data->>'organization_slug', replace(lower(split_part(NEW.email, '@', 1)), '.', '-') || '-' || substr(gen_random_uuid()::text, 1, 8))
            )
            RETURNING id INTO org_id;

            -- Keep legacy behavior: new org creator becomes admin
            new_user_role := 'admin';
        ELSE
            -- Joining an existing org without a secure invite token always creates a contractor
            new_user_role := 'contractor';
        END IF;
    END IF;

    -- Already provisioned at this id: a pre-existing team member is being given
    -- a login at their own id. The row already carries the correct role, org and
    -- history — adopt it untouched.
    IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        RETURN NEW;
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
