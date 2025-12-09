-- Audit Logging System
-- Tracks all changes to sensitive tables for compliance and dispute resolution
-- ==============================================================================

-- Create audit action enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');
    END IF;
END $$;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- RLS for audit_logs (admins/owners can view their org's logs)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
    organization_id = get_user_organization_id()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'owner', 'developer')
    )
);

DROP POLICY IF EXISTS "Developers can view all audit logs" ON audit_logs;
CREATE POLICY "Developers can view all audit logs"
ON audit_logs FOR SELECT
USING (is_developer());

-- Generic audit trigger function
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
    -- Get current user info
    audit_user_id := auth.uid();

    SELECT email INTO audit_user_email
    FROM auth.users
    WHERE id = audit_user_id;

    -- Determine organization_id based on table
    IF TG_OP = 'DELETE' THEN
        old_json := to_jsonb(OLD);
        new_json := NULL;
        -- For organizations table, the id IS the organization_id
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
        -- For organizations table, the id IS the organization_id
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
        -- For organizations table, the id IS the organization_id
        IF TG_TABLE_NAME = 'organizations' THEN
            audit_org_id := (NEW).id;
        ELSE
            audit_org_id := COALESCE(
                new_json->>'organization_id',
                (SELECT organization_id::text FROM users WHERE id = audit_user_id)
            )::UUID;
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

    -- Insert audit record
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

-- Create triggers for sensitive tables

-- Sessions audit trigger
DROP TRIGGER IF EXISTS audit_sessions ON sessions;
CREATE TRIGGER audit_sessions
    AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Invoices audit trigger
DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Clients audit trigger
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Users audit trigger (for role changes, etc.)
DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Service types audit trigger
DROP TRIGGER IF EXISTS audit_service_types ON service_types;
CREATE TRIGGER audit_service_types
    AFTER INSERT OR UPDATE OR DELETE ON service_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Session attendees audit trigger
DROP TRIGGER IF EXISTS audit_session_attendees ON session_attendees;
CREATE TRIGGER audit_session_attendees
    AFTER INSERT OR UPDATE OR DELETE ON session_attendees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Organizations audit trigger (for settings changes)
DROP TRIGGER IF EXISTS audit_organizations ON organizations;
CREATE TRIGGER audit_organizations
    AFTER UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add comment
COMMENT ON TABLE audit_logs IS 'Tracks all changes to sensitive tables for compliance and billing disputes';
