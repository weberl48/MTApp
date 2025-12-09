-- Fix Policy and Audit Issues
-- Addresses role alignment and null auth.uid() handling
-- ==============================================================================

-- ==============================================================================
-- FIX 1: Add admin update policy for organizations (align with owner/developer)
-- ==============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;

-- Add admin to the update policy
CREATE POLICY "Admins can update organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==============================================================================
-- FIX 2: Update audit trigger to handle service-role (null auth.uid())
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
    -- Get current user info (may be null for service-role operations)
    audit_user_id := auth.uid();

    -- Only look up email if we have a user
    IF audit_user_id IS NOT NULL THEN
        SELECT email INTO audit_user_email
        FROM auth.users
        WHERE id = audit_user_id;
    ELSE
        audit_user_email := 'system';
    END IF;

    -- Determine organization_id based on table
    IF TG_OP = 'DELETE' THEN
        old_json := to_jsonb(OLD);
        new_json := NULL;
        -- For organizations table, the id IS the organization_id
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (OLD).id;
        ELSE
            -- Try to get from record, fallback to user's org (if user exists)
            audit_org_id := (old_json->>'organization_id')::UUID;
            IF audit_org_id IS NULL AND audit_user_id IS NOT NULL THEN
                SELECT organization_id INTO audit_org_id FROM users WHERE id = audit_user_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        old_json := NULL;
        new_json := to_jsonb(NEW);
        -- For organizations table, the id IS the organization_id
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (NEW).id;
        ELSE
            audit_org_id := (new_json->>'organization_id')::UUID;
            IF audit_org_id IS NULL AND audit_user_id IS NOT NULL THEN
                SELECT organization_id INTO audit_org_id FROM users WHERE id = audit_user_id;
            END IF;
        END IF;
    ELSE -- UPDATE
        old_json := to_jsonb(OLD);
        new_json := to_jsonb(NEW);
        -- For organizations table, the id IS the organization_id
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (NEW).id;
        ELSE
            audit_org_id := (new_json->>'organization_id')::UUID;
            IF audit_org_id IS NULL AND audit_user_id IS NOT NULL THEN
                SELECT organization_id INTO audit_org_id FROM users WHERE id = audit_user_id;
            END IF;
        END IF;

        -- Calculate changed fields
        changed := ARRAY[]::TEXT[];
        FOR col IN SELECT key FROM jsonb_object_keys(new_json) AS key
        LOOP
            IF old_json->col IS DISTINCT FROM new_json->col THEN
                changed := array_append(changed, col);
            END IF;
        END LOOP;
    END IF;

    -- Insert audit record (org_id may be null for system operations without context)
    INSERT INTO audit_logs (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FIX 3: Update reminder policies to include admin role
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage session reminders" ON session_reminders;

-- Admins can manage reminders for their org
CREATE POLICY "Admins can manage session reminders" ON session_reminders
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

-- ==============================================================================
-- COMMENT
-- ==============================================================================

COMMENT ON FUNCTION audit_trigger_function() IS 'Audit trigger that handles both user-initiated and service-role operations. User_id and org_id may be null for system operations.';
