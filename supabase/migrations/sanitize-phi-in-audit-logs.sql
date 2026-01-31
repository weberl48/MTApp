-- Sanitize PHI in Audit Logs
-- Updates the audit trigger to hash sensitive fields instead of storing raw PHI
-- This ensures audit logs remain useful for compliance without exposing sensitive data
-- ==============================================================================

-- List of PHI field names that should be hashed in audit logs
-- These fields will have their values replaced with SHA-256 hashes
CREATE OR REPLACE FUNCTION get_phi_fields()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY[
        'notes',
        'client_notes',
        'description',  -- client_goals.description
        'contact_email',
        'contact_phone'
    ];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to hash a text value for audit purposes
-- Uses MD5 for performance (audit logs don't need cryptographic security, just change detection)
CREATE OR REPLACE FUNCTION hash_for_audit(value TEXT)
RETURNS TEXT AS $$
BEGIN
    IF value IS NULL OR value = '' THEN
        RETURN NULL;
    END IF;
    -- Return first 16 chars of hash with prefix to indicate it's hashed
    RETURN 'hash:' || LEFT(MD5(value), 16);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to sanitize JSONB data by hashing PHI fields
CREATE OR REPLACE FUNCTION sanitize_phi_jsonb(data JSONB)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql IMMUTABLE;

-- Updated audit trigger function that sanitizes PHI
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
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
    -- Get current user info
    audit_user_id := auth.uid();

    SELECT email INTO audit_user_email
    FROM auth.users
    WHERE id = audit_user_id;

    -- Determine organization_id based on table
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

        -- Calculate changed fields
        changed := ARRAY[]::TEXT[];
        FOR col IN SELECT key FROM jsonb_object_keys(new_json) AS key
        LOOP
            IF old_json->col IS DISTINCT FROM new_json->col THEN
                changed := array_append(changed, col);
            END IF;
        END LOOP;
    END IF;

    -- Sanitize PHI fields before storing in audit log
    old_sanitized := sanitize_phi_jsonb(old_json);
    new_sanitized := sanitize_phi_jsonb(new_json);

    -- Insert audit record with sanitized data
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
        old_sanitized,  -- Sanitized instead of raw
        new_sanitized,  -- Sanitized instead of raw
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

-- Add comment explaining the sanitization
COMMENT ON FUNCTION sanitize_phi_jsonb IS 'Replaces PHI field values with hashes for audit log storage. Maintains change detection capability without storing sensitive data.';
COMMENT ON FUNCTION hash_for_audit IS 'Creates a short hash of text for audit purposes. Uses MD5 prefix for change detection, not security.';
