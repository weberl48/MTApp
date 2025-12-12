-- Client Portal Migration
-- Adds tables and columns for client-facing portal functionality
-- ==============================================================================
-- NOTE: This migration is idempotent - safe to run multiple times
-- ==============================================================================

-- ==============================================================================
-- NEW ENUMS (if they don't exist)
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE session_request_status AS ENUM ('pending', 'approved', 'declined', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('homework', 'file', 'link');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- ADD client_notes TO SESSIONS TABLE (if not exists)
-- ==============================================================================

DO $$ BEGIN
    ALTER TABLE sessions ADD COLUMN client_notes TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

COMMENT ON COLUMN sessions.notes IS 'Internal therapist notes (not visible to clients)';
COMMENT ON COLUMN sessions.client_notes IS 'Client-facing session summary (visible in portal)';

-- ==============================================================================
-- ADD is_active TO CLIENT ACCESS TOKENS (computed from is_revoked)
-- ==============================================================================

-- ==============================================================================
-- CLIENT ACCESS TOKENS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS client_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_accessed_at TIMESTAMPTZ,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add is_active as a generated column (computed from is_revoked)
DO $$ BEGIN
    ALTER TABLE client_access_tokens ADD COLUMN is_active BOOLEAN GENERATED ALWAYS AS (NOT is_revoked) STORED;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Indexes for token lookups (create if not exists)
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_token ON client_access_tokens(token) WHERE NOT is_revoked;
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_client ON client_access_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_expires ON client_access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_organization ON client_access_tokens(organization_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_client_access_tokens_updated_at ON client_access_tokens;
CREATE TRIGGER update_client_access_tokens_updated_at
    BEFORE UPDATE ON client_access_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE client_access_tokens IS 'Token-based access for client portal (no password required)';

-- ==============================================================================
-- SESSION REQUESTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS session_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    preferred_date DATE NOT NULL,
    preferred_time TIME,
    alternative_date DATE,
    alternative_time TIME,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    service_type_id UUID REFERENCES service_types(id),
    notes TEXT,
    status session_request_status NOT NULL DEFAULT 'pending',
    response_notes TEXT,
    responded_by UUID REFERENCES users(id),
    responded_at TIMESTAMPTZ,
    created_session_id UUID REFERENCES sessions(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_requests_client ON session_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests(status);
CREATE INDEX IF NOT EXISTS idx_session_requests_organization ON session_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_pending ON session_requests(organization_id, status) WHERE status = 'pending';

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_session_requests_updated_at ON session_requests;
CREATE TRIGGER update_session_requests_updated_at
    BEFORE UPDATE ON session_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE session_requests IS 'Client-initiated session booking requests';

-- ==============================================================================
-- CLIENT RESOURCES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS client_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type resource_type NOT NULL,
    -- For homework: content is the assignment text
    -- For files: content is the storage path
    -- For links: content is the URL
    content TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_resources_client ON client_resources(client_id);
CREATE INDEX IF NOT EXISTS idx_client_resources_type ON client_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_client_resources_organization ON client_resources(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_resources_incomplete ON client_resources(client_id, is_completed) WHERE NOT is_completed;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_client_resources_updated_at ON client_resources;
CREATE TRIGGER update_client_resources_updated_at
    BEFORE UPDATE ON client_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE client_resources IS 'Homework, files, and links shared with clients';

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_resources ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES: CLIENT ACCESS TOKENS
-- ==============================================================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Staff can view access tokens in org" ON client_access_tokens;
DROP POLICY IF EXISTS "Developers can view all access tokens" ON client_access_tokens;
DROP POLICY IF EXISTS "Staff can create access tokens" ON client_access_tokens;
DROP POLICY IF EXISTS "Staff can update access tokens in org" ON client_access_tokens;
DROP POLICY IF EXISTS "Developers can manage all access tokens" ON client_access_tokens;

-- Staff can view tokens for their organization
CREATE POLICY "Staff can view access tokens in org" ON client_access_tokens
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

-- Developers can view all
CREATE POLICY "Developers can view all access tokens" ON client_access_tokens
    FOR SELECT USING (is_developer());

-- Staff can create tokens
CREATE POLICY "Staff can create access tokens" ON client_access_tokens
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer', 'contractor')
        )
    );

-- Staff can update (revoke) tokens
CREATE POLICY "Staff can update access tokens in org" ON client_access_tokens
    FOR UPDATE USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

-- Developers can manage all
CREATE POLICY "Developers can manage all access tokens" ON client_access_tokens
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: SESSION REQUESTS
-- ==============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Staff can view session requests in org" ON session_requests;
DROP POLICY IF EXISTS "Developers can view all session requests" ON session_requests;
DROP POLICY IF EXISTS "Staff can manage session requests in org" ON session_requests;
DROP POLICY IF EXISTS "Developers can manage all session requests" ON session_requests;

-- Staff can view session requests in their org
CREATE POLICY "Staff can view session requests in org" ON session_requests
    FOR SELECT USING (
        organization_id = get_user_organization_id()
    );

-- Developers can view all
CREATE POLICY "Developers can view all session requests" ON session_requests
    FOR SELECT USING (is_developer());

-- Staff can manage session requests
CREATE POLICY "Staff can manage session requests in org" ON session_requests
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer', 'contractor')
        )
    );

-- Developers can manage all
CREATE POLICY "Developers can manage all session requests" ON session_requests
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: CLIENT RESOURCES
-- ==============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Staff can view resources in org" ON client_resources;
DROP POLICY IF EXISTS "Developers can view all resources" ON client_resources;
DROP POLICY IF EXISTS "Staff can manage resources in org" ON client_resources;
DROP POLICY IF EXISTS "Developers can manage all resources" ON client_resources;

-- Staff can view resources in their org
CREATE POLICY "Staff can view resources in org" ON client_resources
    FOR SELECT USING (
        organization_id = get_user_organization_id()
    );

-- Developers can view all
CREATE POLICY "Developers can view all resources" ON client_resources
    FOR SELECT USING (is_developer());

-- Staff can manage resources
CREATE POLICY "Staff can manage resources in org" ON client_resources
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer', 'contractor')
        )
    );

-- Developers can manage all
CREATE POLICY "Developers can manage all resources" ON client_resources
    FOR ALL USING (is_developer());

-- ==============================================================================
-- STORAGE BUCKET FOR CLIENT RESOURCES
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-resources',
    'client-resources',
    false,  -- Not public - accessed via signed URLs
    52428800, -- 50MB limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'video/mp4',
        'video/webm',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for staff (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Staff can upload client resources" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view client resources" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete client resources" ON storage.objects;

CREATE POLICY "Staff can upload client resources"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'client-resources'
    AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer', 'contractor')
    )
);

CREATE POLICY "Staff can view client resources"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'client-resources'
    AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer', 'contractor')
    )
);

CREATE POLICY "Staff can delete client resources"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'client-resources'
    AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer', 'contractor')
    )
);

-- ==============================================================================
-- AUDIT TRIGGERS
-- ==============================================================================

DROP TRIGGER IF EXISTS audit_client_access_tokens ON client_access_tokens;
DROP TRIGGER IF EXISTS audit_session_requests ON session_requests;
DROP TRIGGER IF EXISTS audit_client_resources ON client_resources;

CREATE TRIGGER audit_client_access_tokens
    AFTER INSERT OR UPDATE OR DELETE ON client_access_tokens
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_session_requests
    AFTER INSERT OR UPDATE OR DELETE ON session_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_client_resources
    AFTER INSERT OR UPDATE OR DELETE ON client_resources
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
