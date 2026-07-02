-- Migration: Fix function search_path security warnings
-- Purpose: Set explicit search_path on all SECURITY DEFINER functions to prevent search_path manipulation attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ==============================================================================
-- Fix: get_user_organization_id()
-- ==============================================================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ==============================================================================
-- Fix: is_developer()
-- ==============================================================================
CREATE OR REPLACE FUNCTION is_developer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'developer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ==============================================================================
-- Fix: update_updated_at()
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ==============================================================================
-- Fix: update_contractor_rates_updated_at()
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_contractor_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ==============================================================================
-- Fix: generate_unique_slug()
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_unique_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base slug from name
    base_slug := LOWER(REGEXP_REPLACE(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);

    -- Check if slug exists, append number if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- ==============================================================================
-- Fix: create_session_reminders()
-- ==============================================================================
CREATE OR REPLACE FUNCTION create_session_reminders()
RETURNS TRIGGER AS $$
DECLARE
    org_settings JSONB;
    session_date TIMESTAMPTZ;
    contractor_email TEXT;
    contractor_name TEXT;
    reminder_hours INTEGER;
BEGIN
    -- Only create reminders for submitted sessions with future dates
    IF NEW.status = 'submitted' AND NEW.date >= CURRENT_DATE THEN
        -- Get organization settings
        SELECT settings INTO org_settings
        FROM public.organizations
        WHERE id = NEW.organization_id;

        -- Get contractor info
        SELECT email, name INTO contractor_email, contractor_name
        FROM public.users
        WHERE id = NEW.contractor_id;

        -- Create session datetime (assume 9 AM if no time specified)
        session_date := (NEW.date || ' 09:00:00')::TIMESTAMPTZ;

        -- Default to 24 hours before if not configured
        reminder_hours := COALESCE((org_settings->'session'->>'reminder_hours')::INTEGER, 24);

        -- Create contractor reminder
        INSERT INTO public.session_reminders (
            organization_id,
            session_id,
            reminder_type,
            recipient_email,
            recipient_name,
            scheduled_for,
            status
        ) VALUES (
            NEW.organization_id,
            NEW.id,
            'contractor_reminder',
            contractor_email,
            contractor_name,
            session_date - (reminder_hours || ' hours')::INTERVAL,
            'pending'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ==============================================================================
-- Fix: cancel_session_reminders()
-- ==============================================================================
CREATE OR REPLACE FUNCTION cancel_session_reminders()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status != 'submitted') THEN
        UPDATE public.session_reminders
        SET status = 'cancelled', updated_at = NOW()
        WHERE session_id = COALESCE(OLD.id, NEW.id)
        AND status = 'pending';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ==============================================================================
-- Fix: audit_trigger_function()
-- ==============================================================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
    audit_user_email TEXT;
    audit_org_id UUID;
    changed TEXT[];
    old_json JSONB;
    new_json JSONB;
    col TEXT;
BEGIN
    audit_user_id := auth.uid();

    SELECT email INTO audit_user_email
    FROM auth.users
    WHERE id = audit_user_id;

    IF TG_OP = 'DELETE' THEN
        old_json := to_jsonb(OLD);
        new_json := NULL;
        -- For organizations table, the id IS the organization_id
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (OLD).id;
        ELSE
            audit_org_id := COALESCE(
                old_json->>'organization_id',
                (SELECT organization_id::text FROM public.users WHERE id = audit_user_id)
            )::UUID;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        old_json := NULL;
        new_json := to_jsonb(NEW);
        -- For organizations table, the id IS the organization_id
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (NEW).id;
        ELSE
            audit_org_id := COALESCE(
                new_json->>'organization_id',
                (SELECT organization_id::text FROM public.users WHERE id = audit_user_id)
            )::UUID;
        END IF;
    ELSE
        old_json := to_jsonb(OLD);
        new_json := to_jsonb(NEW);
        -- For organizations table, the id IS the organization_id
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (NEW).id;
        ELSE
            audit_org_id := COALESCE(
                new_json->>'organization_id',
                (SELECT organization_id::text FROM public.users WHERE id = audit_user_id)
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

    INSERT INTO public.audit_logs (
        organization_id,
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_fields,
        user_id,
        user_email
    ) VALUES (
        audit_org_id,
        TG_TABLE_NAME,
        COALESCE((NEW).id, (OLD).id),
        TG_OP::audit_action,
        old_json,
        new_json,
        changed,
        audit_user_id,
        audit_user_email
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ==============================================================================
-- Fix: handle_new_user()
-- ==============================================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
