-- May Creative Arts Database Schema
-- Multi-tenant SaaS platform for music therapy practice management
-- Run this in Supabase SQL Editor to set up a fresh database
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- ENUMS
-- ==============================================================================

CREATE TYPE user_role AS ENUM ('developer', 'owner', 'admin', 'contractor');
CREATE TYPE plan_type AS ENUM ('free', 'starter', 'professional');
CREATE TYPE session_status AS ENUM ('draft', 'submitted', 'approved');
CREATE TYPE invoice_status AS ENUM ('pending', 'sent', 'paid');
CREATE TYPE payment_method AS ENUM ('private_pay', 'self_directed', 'group_home', 'scholarship');
CREATE TYPE goal_status AS ENUM ('active', 'met', 'not_met');
CREATE TYPE location_type AS ENUM ('in_home', 'matts_music', 'other');
CREATE TYPE service_category AS ENUM ('music_individual', 'music_group', 'art_individual', 'art_group');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
CREATE TYPE reminder_type AS ENUM ('contractor_reminder', 'client_reminder', 'admin_notification');

-- ==============================================================================
-- ORGANIZATIONS TABLE (Multi-tenancy foundation)
-- ==============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    logo_url TEXT,
    -- Branding
    primary_color TEXT NOT NULL DEFAULT '#3b82f6',
    secondary_color TEXT NOT NULL DEFAULT '#1e40af',
    tagline TEXT,
    description TEXT,
    tax_id TEXT,
    social_links JSONB NOT NULL DEFAULT '{}',
    business_hours JSONB NOT NULL DEFAULT '{}',
    -- Regional
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    currency TEXT NOT NULL DEFAULT 'USD',
    -- Subscription
    plan plan_type NOT NULL DEFAULT 'free',
    trial_ends_at TIMESTAMPTZ,
    -- Settings (JSONB for flexibility)
    settings JSONB NOT NULL DEFAULT '{
        "invoice": {
            "footer_text": "Thank you for your business!",
            "payment_instructions": "",
            "due_days": 30,
            "send_reminders": true,
            "reminder_days": [7, 1]
        },
        "session": {
            "default_duration": 30,
            "duration_options": [30, 45, 60, 90],
            "require_notes": false,
            "auto_submit": false,
            "reminder_hours": 24,
            "send_reminders": true
        },
        "notification": {
            "email_on_session_submit": true,
            "email_on_invoice_paid": true,
            "admin_email": ""
        }
    }',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- ==============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'contractor',
    name TEXT NOT NULL,
    phone TEXT,
    payment_info JSONB,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- CLIENTS TABLE
-- ==============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    payment_method payment_method NOT NULL DEFAULT 'private_pay',
    notes TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SERVICE TYPES TABLE (pricing configuration)
-- ==============================================================================

CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category service_category NOT NULL,
    location location_type NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    per_person_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    mca_percentage DECIMAL(5,2) NOT NULL,
    contractor_cap DECIMAL(10,2),
    rent_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SESSIONS TABLE
-- ==============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    status session_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    contractor_paid_date DATE,
    contractor_paid_amount DECIMAL(10,2),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- SESSION ATTENDEES TABLE (many-to-many)
-- ==============================================================================

CREATE TABLE session_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    individual_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, client_id)
);

-- ==============================================================================
-- INVOICES TABLE
-- ==============================================================================

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    amount DECIMAL(10,2) NOT NULL,
    mca_cut DECIMAL(10,2) NOT NULL,
    contractor_pay DECIMAL(10,2) NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    due_date DATE,
    paid_date DATE,
    -- Square integration
    square_invoice_id TEXT,
    square_payment_url TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- CLIENT GOALS TABLE
-- ==============================================================================

CREATE TABLE client_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status goal_status NOT NULL DEFAULT 'active',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ==============================================================================
-- AUDIT LOGS TABLE
-- ==============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ==============================================================================
-- SESSION REMINDERS TABLE
-- ==============================================================================

CREATE TABLE session_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status reminder_status NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

-- Clients
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_name ON clients(name);

-- Service Types
CREATE INDEX idx_service_types_organization ON service_types(organization_id);
CREATE INDEX idx_service_types_active ON service_types(organization_id, is_active);

-- Sessions
CREATE INDEX idx_sessions_organization ON sessions(organization_id);
CREATE INDEX idx_sessions_contractor ON sessions(contractor_id);
CREATE INDEX idx_sessions_date ON sessions(date DESC);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_unpaid ON sessions(contractor_paid_date) WHERE contractor_paid_date IS NULL;

-- Session Attendees
CREATE INDEX idx_session_attendees_session ON session_attendees(session_id);
CREATE INDEX idx_session_attendees_client ON session_attendees(client_id);

-- Invoices
CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_session ON invoices(session_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_square ON invoices(square_invoice_id) WHERE square_invoice_id IS NOT NULL;

-- Client Goals
CREATE INDEX idx_client_goals_client ON client_goals(client_id);
CREATE INDEX idx_client_goals_organization ON client_goals(organization_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Session Reminders
CREATE INDEX idx_session_reminders_organization ON session_reminders(organization_id);
CREATE INDEX idx_session_reminders_session ON session_reminders(session_id);
CREATE INDEX idx_session_reminders_scheduled ON session_reminders(scheduled_for) WHERE status = 'pending';

-- ==============================================================================
-- HELPER FUNCTIONS
-- ==============================================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is a developer
CREATE OR REPLACE FUNCTION is_developer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'developer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON service_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES: ORGANIZATIONS
-- ==============================================================================

CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "Developers can view all organizations" ON organizations
    FOR SELECT USING (is_developer());

CREATE POLICY "Owners can update own organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'developer')
        )
    );

CREATE POLICY "Developers can update all organizations" ON organizations
    FOR UPDATE USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: USERS
-- ==============================================================================

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users in same org can view each other" ON users
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Developers can view all users" ON users
    FOR SELECT USING (is_developer());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update users in org" ON users
    FOR UPDATE USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can update all users" ON users
    FOR UPDATE USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: CLIENTS
-- ==============================================================================

CREATE POLICY "Users can view clients in org" ON clients
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Developers can view all clients" ON clients
    FOR SELECT USING (is_developer());

CREATE POLICY "Admins can manage clients" ON clients
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can manage all clients" ON clients
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: SERVICE TYPES
-- ==============================================================================

CREATE POLICY "Users can view service types in org" ON service_types
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Developers can view all service types" ON service_types
    FOR SELECT USING (is_developer());

CREATE POLICY "Admins can manage service types" ON service_types
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can manage all service types" ON service_types
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: SESSIONS
-- ==============================================================================

CREATE POLICY "Contractors can view own sessions" ON sessions
    FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Admins can view sessions in org" ON sessions
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can view all sessions" ON sessions
    FOR SELECT USING (is_developer());

CREATE POLICY "Contractors can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (
        contractor_id = auth.uid()
        AND organization_id = get_user_organization_id()
    );

CREATE POLICY "Contractors can update own draft sessions" ON sessions
    FOR UPDATE USING (contractor_id = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can manage sessions in org" ON sessions
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can manage all sessions" ON sessions
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: SESSION ATTENDEES
-- ==============================================================================

CREATE POLICY "View attendees for accessible sessions" ON session_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND (s.contractor_id = auth.uid() OR s.organization_id = get_user_organization_id())
        )
    );

CREATE POLICY "Contractors can insert attendees for own sessions" ON session_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.contractor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage attendees" ON session_attendees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.organization_id = get_user_organization_id()
            AND EXISTS (
                SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
            )
        )
    );

CREATE POLICY "Developers can manage all attendees" ON session_attendees
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: INVOICES
-- ==============================================================================

CREATE POLICY "Contractors can view invoices for their sessions" ON invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.contractor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view invoices in org" ON invoices
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can view all invoices" ON invoices
    FOR SELECT USING (is_developer());

CREATE POLICY "Admins can manage invoices in org" ON invoices
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can manage all invoices" ON invoices
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: CLIENT GOALS
-- ==============================================================================

CREATE POLICY "Users can view goals in org" ON client_goals
    FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Developers can view all goals" ON client_goals
    FOR SELECT USING (is_developer());

CREATE POLICY "Admins can manage goals" ON client_goals
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can manage all goals" ON client_goals
    FOR ALL USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: AUDIT LOGS
-- ==============================================================================

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Developers can view all audit logs" ON audit_logs
    FOR SELECT USING (is_developer());

-- ==============================================================================
-- RLS POLICIES: SESSION REMINDERS
-- ==============================================================================

CREATE POLICY "Users can view own session reminders" ON session_reminders
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND role IN ('admin', 'owner', 'developer')
            )
            OR EXISTS (
                SELECT 1 FROM sessions s
                WHERE s.id = session_id
                AND s.contractor_id = auth.uid()
            )
        )
    );

CREATE POLICY "Developers can view all reminders" ON session_reminders
    FOR SELECT USING (is_developer());

CREATE POLICY "Admins can manage reminders" ON session_reminders
    FOR ALL USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
    );

-- ==============================================================================
-- AUDIT TRIGGER FUNCTION
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
    ELSE
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

        changed := ARRAY[]::TEXT[];
        FOR col IN SELECT key FROM jsonb_object_keys(new_json) AS key
        LOOP
            IF old_json->col IS DISTINCT FROM new_json->col THEN
                changed := array_append(changed, col);
            END IF;
        END LOOP;
    END IF;

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

-- Audit triggers on sensitive tables
CREATE TRIGGER audit_sessions
    AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_clients
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_service_types
    AFTER INSERT OR UPDATE OR DELETE ON service_types
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_organizations
    AFTER UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ==============================================================================
-- USER SIGNUP HANDLER
-- ==============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Check if organization is specified in metadata
    org_id := NEW.raw_user_meta_data->>'organization_id';

    IF org_id IS NULL THEN
        -- Create a new organization for this user
        INSERT INTO public.organizations (name, slug)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'organization_name', split_part(NEW.email, '@', 1) || '''s Practice'),
            COALESCE(NEW.raw_user_meta_data->>'organization_slug', replace(lower(split_part(NEW.email, '@', 1)), '.', '-') || '-' || substr(gen_random_uuid()::text, 1, 8))
        )
        RETURNING id INTO org_id;
    END IF;

    INSERT INTO public.users (id, email, name, role, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'contractor'),
        org_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==============================================================================
-- STORAGE BUCKET FOR ORGANIZATION ASSETS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can view org assets"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
);

CREATE POLICY "Owners can upload org assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
    AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'developer')
    )
);

CREATE POLICY "Owners can update org assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
    AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'developer')
    )
);

CREATE POLICY "Owners can delete org assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = get_user_organization_id()::text
    AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'developer')
    )
);

CREATE POLICY "Developers can access all storage"
ON storage.objects FOR ALL
USING (is_developer());

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations (practices)';
COMMENT ON TABLE users IS 'User profiles linked to auth.users';
COMMENT ON TABLE clients IS 'Clients/patients of the practice';
COMMENT ON TABLE service_types IS 'Configurable service types with pricing rules';
COMMENT ON TABLE sessions IS 'Therapy sessions logged by contractors';
COMMENT ON TABLE session_attendees IS 'Clients who attended a session';
COMMENT ON TABLE invoices IS 'Invoices generated from sessions';
COMMENT ON TABLE client_goals IS 'Treatment goals for clients';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance';
COMMENT ON TABLE session_reminders IS 'Scheduled email reminders';
