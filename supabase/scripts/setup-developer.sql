-- Setup Developer Account
-- Run this AFTER the add-developer-role.sql migration has been committed
-- ========================================================================

-- Step 1: Add 'developer' enum value (if not already added)
-- Run this first, then commit, then run Step 2

-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';

-- Step 2: Assign developer role to weberlucasdev@gmail.com
-- Run this after Step 1 is committed

UPDATE public.users
SET role = 'developer'
WHERE email = 'weberlucasdev@gmail.com';

-- Verify the update
SELECT id, email, name, role, organization_id
FROM public.users
WHERE email = 'weberlucasdev@gmail.com';

-- ========================================================================
-- DEVELOPER PERMISSIONS EXPLANATION
-- ========================================================================
-- The 'developer' role grants:
-- 1. Access to ALL organizations (bypasses RLS via special policy)
-- 2. All admin/owner capabilities across the platform
-- 3. Ability to switch organization context (impersonate)
-- 4. Access to developer-only features in the UI
-- ========================================================================

-- Create a function to check if user is developer
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

-- ========================================================================
-- UPDATE RLS POLICIES TO ALLOW DEVELOPER ACCESS
-- ========================================================================

-- Organizations: Developer can see all
DROP POLICY IF EXISTS "Developers can view all organizations" ON organizations;
CREATE POLICY "Developers can view all organizations"
ON organizations FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can update all organizations" ON organizations;
CREATE POLICY "Developers can update all organizations"
ON organizations FOR UPDATE
USING (is_developer());

-- Users: Developer can see all users across all orgs
DROP POLICY IF EXISTS "Developers can view all users" ON users;
CREATE POLICY "Developers can view all users"
ON users FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can update all users" ON users;
CREATE POLICY "Developers can update all users"
ON users FOR UPDATE
USING (is_developer());

-- Clients: Developer can access all
DROP POLICY IF EXISTS "Developers can view all clients" ON clients;
CREATE POLICY "Developers can view all clients"
ON clients FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can manage all clients" ON clients;
CREATE POLICY "Developers can manage all clients"
ON clients FOR ALL
USING (is_developer());

-- Sessions: Developer can access all
DROP POLICY IF EXISTS "Developers can view all sessions" ON sessions;
CREATE POLICY "Developers can view all sessions"
ON sessions FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can manage all sessions" ON sessions;
CREATE POLICY "Developers can manage all sessions"
ON sessions FOR ALL
USING (is_developer());

-- Session Attendees: Developer can access all
DROP POLICY IF EXISTS "Developers can view all session_attendees" ON session_attendees;
CREATE POLICY "Developers can view all session_attendees"
ON session_attendees FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can manage all session_attendees" ON session_attendees;
CREATE POLICY "Developers can manage all session_attendees"
ON session_attendees FOR ALL
USING (is_developer());

-- Invoices: Developer can access all
DROP POLICY IF EXISTS "Developers can view all invoices" ON invoices;
CREATE POLICY "Developers can view all invoices"
ON invoices FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can manage all invoices" ON invoices;
CREATE POLICY "Developers can manage all invoices"
ON invoices FOR ALL
USING (is_developer());

-- Service Types: Developer can access all
DROP POLICY IF EXISTS "Developers can view all service_types" ON service_types;
CREATE POLICY "Developers can view all service_types"
ON service_types FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can manage all service_types" ON service_types;
CREATE POLICY "Developers can manage all service_types"
ON service_types FOR ALL
USING (is_developer());

-- Client Goals: Developer can access all
DROP POLICY IF EXISTS "Developers can view all client_goals" ON client_goals;
CREATE POLICY "Developers can view all client_goals"
ON client_goals FOR SELECT
USING (is_developer());

DROP POLICY IF EXISTS "Developers can manage all client_goals" ON client_goals;
CREATE POLICY "Developers can manage all client_goals"
ON client_goals FOR ALL
USING (is_developer());

-- Storage: Developer can access all organization assets
DROP POLICY IF EXISTS "Developers can access all storage" ON storage.objects;
CREATE POLICY "Developers can access all storage"
ON storage.objects FOR ALL
USING (is_developer());

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================
DO $$
BEGIN
    RAISE NOTICE 'Developer setup complete for weberlucasdev@gmail.com';
    RAISE NOTICE 'Developer can now:';
    RAISE NOTICE '  - View all organizations';
    RAISE NOTICE '  - Access all data across the platform';
    RAISE NOTICE '  - Switch between organizations';
END $$;
