-- User invite tokens (role-specific invites for existing organizations)
-- Enables secure owner/admin/contractor invites without trusting client-provided role metadata.

CREATE TABLE IF NOT EXISTS user_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    invited_email TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_invites_org_role
    ON user_invites (organization_id, role);

CREATE INDEX IF NOT EXISTS idx_user_invites_expires
    ON user_invites (expires_at);

ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;

-- Developer-only for now
DROP POLICY IF EXISTS "Developers can manage user invites" ON user_invites;
CREATE POLICY "Developers can manage user invites" ON user_invites
    FOR ALL
    USING (is_developer())
    WITH CHECK (is_developer());

-- Update handle_new_user to support secure invite tokens
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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

    -- If no valid invite token, fall back to legacy behavior
    IF org_id IS NULL THEN
        org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;

        IF org_id IS NULL THEN
            -- Creating new organization - use generate_unique_slug to avoid conflicts
            INSERT INTO public.organizations (name, slug, email)
            VALUES (
                COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Practice'),
                generate_unique_slug(COALESCE(NEW.raw_user_meta_data->>'organization_name', 'my-practice-' || substr(NEW.id::text, 1, 8))),
                NEW.email
            )
            RETURNING id INTO org_id;

            new_user_role := 'admin';

            -- Create default service types for new org
            INSERT INTO public.service_types (organization_id, name, category, location, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage, is_active, display_order) VALUES
                (org_id, 'Individual Music Therapy', 'music_individual', 'in_home', 50.00, 0, 25.00, NULL, 0, true, 1),
                (org_id, 'Group Music Therapy', 'music_group', 'in_home', 50.00, 20.00, 30.00, NULL, 0, true, 2),
                (org_id, 'Individual Art Therapy', 'art_individual', 'in_home', 40.00, 0, 25.00, NULL, 0, true, 3),
                (org_id, 'Group Art Therapy', 'art_group', 'in_home', 40.00, 15.00, 30.00, NULL, 0, true, 4);
        ELSE
            -- Joining existing org without a secure invite token always creates a contractor
            new_user_role := 'contractor';
        END IF;
    END IF;

    INSERT INTO public.users (id, email, name, role, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        new_user_role,
        org_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


