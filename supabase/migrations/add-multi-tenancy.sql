-- Multi-Tenancy Migration
-- Transforms the app from single-business to SaaS platform
-- Each organization (therapy practice) has isolated data

-- ============================================
-- STEP 1: Create Organizations Table
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier (e.g., "may-creative-arts")
    email TEXT,
    phone TEXT,
    address TEXT,
    website TEXT,
    logo_url TEXT,
    -- Subscription/billing (for future)
    plan TEXT NOT NULL DEFAULT 'free', -- free, starter, professional
    trial_ends_at TIMESTAMPTZ,
    -- Settings (moved from app_settings)
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
            "auto_submit": false
        },
        "notification": {
            "email_on_session_submit": true,
            "email_on_invoice_paid": true,
            "admin_email": ""
        }
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- ============================================
-- STEP 2: Add organization_id to all tables
-- ============================================

-- Add organization_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- Add organization_id to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);

-- Add organization_id to service_types
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_service_types_organization ON service_types(organization_id);

-- Add organization_id to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_sessions_organization ON sessions(organization_id);

-- Add organization_id to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);

-- Add organization_id to client_goals
ALTER TABLE client_goals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_client_goals_organization ON client_goals(organization_id);

-- Add organization_id to app_settings (for legacy, will eventually deprecate)
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_app_settings_organization ON app_settings(organization_id);

-- ============================================
-- STEP 3: Create Default Organization for Existing Data
-- ============================================

-- Insert May Creative Arts as the first organization (if not exists)
INSERT INTO organizations (id, name, slug, email, settings)
VALUES (
    'a0000000-0000-0000-0000-000000000001', -- Fixed UUID for migration
    'May Creative Arts',
    'may-creative-arts',
    'maycreativearts@gmail.com',
    '{
        "invoice": {
            "footer_text": "Thank you for your business!",
            "payment_instructions": "Please make checks payable to May Creative Arts",
            "due_days": 30,
            "send_reminders": true,
            "reminder_days": [7, 1]
        },
        "session": {
            "default_duration": 30,
            "duration_options": [30, 45, 60, 90],
            "require_notes": false,
            "auto_submit": false
        },
        "notification": {
            "email_on_session_submit": true,
            "email_on_invoice_paid": true,
            "admin_email": "maycreativearts@gmail.com"
        }
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Migrate existing data to the default organization
UPDATE users SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE clients SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE service_types SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE sessions SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE client_goals SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE app_settings SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- ============================================
-- STEP 4: Make organization_id required (after migration)
-- ============================================

-- Note: Only run these if you're sure all data has been migrated
-- ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE service_types ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE sessions ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE invoices ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE client_goals ALTER COLUMN organization_id SET NOT NULL;

-- ============================================
-- STEP 5: Enable RLS on Organizations
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view their own organization
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Admins can update their organization (using 'admin' role for now, we'll add 'owner' separately)
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
CREATE POLICY "Admins can update organization" ON organizations
    FOR UPDATE USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- STEP 6: Update RLS Policies for Multi-Tenancy
-- ============================================

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop existing policies and recreate with org filtering

-- USERS POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

DROP POLICY IF EXISTS "Users can view users in same org" ON users;
CREATE POLICY "Users can view users in same org" ON users
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update users in org" ON users;
CREATE POLICY "Admins can update users in org" ON users
    FOR UPDATE USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- CLIENTS POLICIES
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can update clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

DROP POLICY IF EXISTS "Users can view clients in org" ON clients;
CREATE POLICY "Users can view clients in org" ON clients
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Admins can insert clients in org" ON clients;
CREATE POLICY "Admins can insert clients in org" ON clients
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can update clients in org" ON clients;
CREATE POLICY "Admins can update clients in org" ON clients
    FOR UPDATE USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can delete clients in org" ON clients;
CREATE POLICY "Admins can delete clients in org" ON clients
    FOR DELETE USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- SERVICE_TYPES POLICIES
DROP POLICY IF EXISTS "Authenticated users can view service types" ON service_types;
DROP POLICY IF EXISTS "Admins can manage service types" ON service_types;

DROP POLICY IF EXISTS "Users can view service types in org" ON service_types;
CREATE POLICY "Users can view service types in org" ON service_types
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Admins can manage service types in org" ON service_types;
CREATE POLICY "Admins can manage service types in org" ON service_types
    FOR ALL USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- SESSIONS POLICIES
DROP POLICY IF EXISTS "Contractors can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON sessions;
DROP POLICY IF EXISTS "Contractors can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Contractors can update own draft sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can update all sessions" ON sessions;

DROP POLICY IF EXISTS "Contractors can view own sessions in org" ON sessions;
CREATE POLICY "Contractors can view own sessions in org" ON sessions
    FOR SELECT USING (
        organization_id = get_user_organization_id() AND
        contractor_id = auth.uid()
    );

DROP POLICY IF EXISTS "Admins can view all sessions in org" ON sessions;
CREATE POLICY "Admins can view all sessions in org" ON sessions
    FOR SELECT USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Contractors can insert sessions in org" ON sessions;
CREATE POLICY "Contractors can insert sessions in org" ON sessions
    FOR INSERT WITH CHECK (
        organization_id = get_user_organization_id() AND
        contractor_id = auth.uid()
    );

DROP POLICY IF EXISTS "Contractors can update own draft sessions" ON sessions;
CREATE POLICY "Contractors can update own draft sessions" ON sessions
    FOR UPDATE USING (
        organization_id = get_user_organization_id() AND
        contractor_id = auth.uid() AND
        status = 'draft'
    );

DROP POLICY IF EXISTS "Admins can update all sessions in org" ON sessions;
CREATE POLICY "Admins can update all sessions in org" ON sessions
    FOR UPDATE USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- SESSION_ATTENDEES POLICIES
DROP POLICY IF EXISTS "View attendees for accessible sessions" ON session_attendees;
DROP POLICY IF EXISTS "Insert attendees for own sessions" ON session_attendees;
DROP POLICY IF EXISTS "Admins can manage attendees" ON session_attendees;

DROP POLICY IF EXISTS "View attendees for accessible sessions in org" ON session_attendees;
CREATE POLICY "View attendees for accessible sessions in org" ON session_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.organization_id = get_user_organization_id()
            AND (s.contractor_id = auth.uid() OR EXISTS (
                SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
            ))
        )
    );

DROP POLICY IF EXISTS "Insert attendees for own sessions in org" ON session_attendees;
CREATE POLICY "Insert attendees for own sessions in org" ON session_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.organization_id = get_user_organization_id()
            AND s.contractor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage attendees in org" ON session_attendees;
CREATE POLICY "Admins can manage attendees in org" ON session_attendees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.organization_id = get_user_organization_id()
            AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        )
    );

-- INVOICES POLICIES
DROP POLICY IF EXISTS "Admins can view invoices" ON invoices;
DROP POLICY IF EXISTS "Contractors can view invoices for their sessions" ON invoices;
DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;

DROP POLICY IF EXISTS "Admins can view invoices in org" ON invoices;
CREATE POLICY "Admins can view invoices in org" ON invoices
    FOR SELECT USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Contractors can view own session invoices" ON invoices;
CREATE POLICY "Contractors can view own session invoices" ON invoices
    FOR SELECT USING (
        organization_id = get_user_organization_id() AND
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.contractor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage invoices in org" ON invoices;
CREATE POLICY "Admins can manage invoices in org" ON invoices
    FOR ALL USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- CLIENT_GOALS POLICIES
DROP POLICY IF EXISTS "Authenticated users can view goals" ON client_goals;
DROP POLICY IF EXISTS "Admins can manage goals" ON client_goals;

DROP POLICY IF EXISTS "Users can view goals in org" ON client_goals;
CREATE POLICY "Users can view goals in org" ON client_goals
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Admins can manage goals in org" ON client_goals;
CREATE POLICY "Admins can manage goals in org" ON client_goals
    FOR ALL USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- APP_SETTINGS POLICIES (update existing)
DROP POLICY IF EXISTS "Authenticated users can view settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;

DROP POLICY IF EXISTS "Users can view settings in org" ON app_settings;
CREATE POLICY "Users can view settings in org" ON app_settings
    FOR SELECT USING (organization_id = get_user_organization_id());

DROP POLICY IF EXISTS "Admins can manage settings in org" ON app_settings;
CREATE POLICY "Admins can manage settings in org" ON app_settings
    FOR ALL USING (
        organization_id = get_user_organization_id() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- STEP 7: Update User Signup Handler
-- ============================================

-- Update handle_new_user to support org creation or joining
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    new_user_role user_role;
BEGIN
    -- Check if user is creating a new org or joining existing
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;

    IF org_id IS NULL THEN
        -- Creating new organization - user becomes admin (owner role added later)
        INSERT INTO public.organizations (name, slug, email)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Practice'),
            COALESCE(
                NEW.raw_user_meta_data->>'organization_slug',
                LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'organization_name', 'my-practice-' || substr(NEW.id::text, 1, 8)), ' ', '-'))
            ),
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
        -- Joining existing org
        new_user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'contractor');
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

-- ============================================
-- STEP 8: Organization Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- STEP 9: Helper function to generate unique slug
-- ============================================

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
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
