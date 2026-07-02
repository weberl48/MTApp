-- Migration: Fix RLS Performance Warnings
-- Purpose: Address auth_rls_initplan, multiple_permissive_policies, and duplicate_index warnings
-- Reference: https://supabase.com/docs/guides/database/database-linter

-- ==============================================================================
-- PART 1: Remove Duplicate Indexes
-- ==============================================================================

DROP INDEX IF EXISTS idx_clients_org_id;
DROP INDEX IF EXISTS idx_users_org_id;

-- ==============================================================================
-- PART 2: Fix Auth RLS Initplan - Wrap auth.uid() in subqueries
-- This prevents auth.uid() from being re-evaluated for every row
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- ORGANIZATIONS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view own organization" ON organizations
    FOR SELECT USING (id = (select get_user_organization_id()));

DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
CREATE POLICY "Admins can update organization" ON organizations
    FOR UPDATE USING (
        id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('owner', 'admin', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- USERS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update users in org" ON users;
CREATE POLICY "Admins can update users in org" ON users
    FOR UPDATE USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- CLIENTS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all clients in org" ON clients;
CREATE POLICY "Admins can view all clients in org" ON clients
    FOR SELECT USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

DROP POLICY IF EXISTS "Admins can insert clients in org" ON clients;
CREATE POLICY "Admins can insert clients in org" ON clients
    FOR INSERT WITH CHECK (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

DROP POLICY IF EXISTS "Admins can update clients in org" ON clients;
CREATE POLICY "Admins can update clients in org" ON clients
    FOR UPDATE USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

DROP POLICY IF EXISTS "Admins can delete clients in org" ON clients;
CREATE POLICY "Admins can delete clients in org" ON clients
    FOR DELETE USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- SERVICE_TYPES policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage service types in org" ON service_types;
CREATE POLICY "Admins can manage service types in org" ON service_types
    FOR ALL USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- SESSIONS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Contractors can view own sessions in org" ON sessions;
CREATE POLICY "Contractors can view own sessions in org" ON sessions
    FOR SELECT USING (
        contractor_id = (select auth.uid())
        AND organization_id = (select get_user_organization_id())
    );

DROP POLICY IF EXISTS "Admins can view all sessions in org" ON sessions;
CREATE POLICY "Admins can view all sessions in org" ON sessions
    FOR SELECT USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

DROP POLICY IF EXISTS "Contractors can insert sessions in org" ON sessions;
CREATE POLICY "Contractors can insert sessions in org" ON sessions
    FOR INSERT WITH CHECK (
        contractor_id = (select auth.uid())
        AND organization_id = (select get_user_organization_id())
    );

DROP POLICY IF EXISTS "Contractors can update own draft sessions" ON sessions;
CREATE POLICY "Contractors can update own draft sessions" ON sessions
    FOR UPDATE USING (
        contractor_id = (select auth.uid())
        AND status = 'draft'
    );

DROP POLICY IF EXISTS "Admins can update all sessions in org" ON sessions;
CREATE POLICY "Admins can update all sessions in org" ON sessions
    FOR UPDATE USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- SESSION_ATTENDEES policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "View attendees for accessible sessions in org" ON session_attendees;
CREATE POLICY "View attendees for accessible sessions in org" ON session_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND (
                s.contractor_id = (select auth.uid())
                OR s.organization_id = (select get_user_organization_id())
            )
        )
    );

DROP POLICY IF EXISTS "Insert attendees for own sessions in org" ON session_attendees;
CREATE POLICY "Insert attendees for own sessions in org" ON session_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.contractor_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Admins can manage attendees in org" ON session_attendees;
CREATE POLICY "Admins can manage attendees in org" ON session_attendees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.organization_id = (select get_user_organization_id())
            AND EXISTS (
                SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
            )
        )
    );

-- -----------------------------------------------------------------------------
-- INVOICES policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Contractors can view own session invoices" ON invoices;
CREATE POLICY "Contractors can view own session invoices" ON invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.contractor_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Admins can view invoices in org" ON invoices;
CREATE POLICY "Admins can view invoices in org" ON invoices
    FOR SELECT USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

DROP POLICY IF EXISTS "Admins can manage invoices in org" ON invoices;
CREATE POLICY "Admins can manage invoices in org" ON invoices
    FOR ALL USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- CLIENT_GOALS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage goals in org" ON client_goals;
CREATE POLICY "Admins can manage goals in org" ON client_goals
    FOR ALL USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- AUDIT_LOGS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = (select auth.uid())
            AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- APP_SETTINGS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage settings in org" ON app_settings;
CREATE POLICY "Admins can manage settings in org" ON app_settings
    FOR ALL USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );

-- -----------------------------------------------------------------------------
-- SESSION_REMINDERS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own session reminders" ON session_reminders;
CREATE POLICY "Users can view own session reminders" ON session_reminders
    FOR SELECT USING (
        organization_id = (select get_user_organization_id())
        AND (
            EXISTS (
                SELECT 1 FROM users
                WHERE id = (select auth.uid())
                AND role IN ('admin', 'owner', 'developer')
            )
            OR EXISTS (
                SELECT 1 FROM sessions s
                WHERE s.id = session_id
                AND s.contractor_id = (select auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Admins can manage reminders" ON session_reminders;
CREATE POLICY "Admins can manage reminders" ON session_reminders
    FOR ALL USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = (select auth.uid())
            AND role IN ('admin', 'owner', 'developer')
        )
    );

-- Drop duplicate policy if it exists
DROP POLICY IF EXISTS "Admins can manage session reminders" ON session_reminders;

-- -----------------------------------------------------------------------------
-- CLIENT_RESOURCES policies (if table exists)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_resources') THEN
        DROP POLICY IF EXISTS "Staff can manage resources in org" ON client_resources;
        EXECUTE 'CREATE POLICY "Staff can manage resources in org" ON client_resources
            FOR ALL USING (
                organization_id = (select get_user_organization_id())
                AND EXISTS (
                    SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN (''admin'', ''owner'', ''developer'', ''contractor'')
                )
            )';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- SESSION_REQUESTS policies (if table exists)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_requests') THEN
        DROP POLICY IF EXISTS "Staff can manage session requests in org" ON session_requests;
        EXECUTE 'CREATE POLICY "Staff can manage session requests in org" ON session_requests
            FOR ALL USING (
                organization_id = (select get_user_organization_id())
                AND EXISTS (
                    SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN (''admin'', ''owner'', ''developer'', ''contractor'')
                )
            )';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- CLIENT_ACCESS_TOKENS policies (if table exists)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_access_tokens') THEN
        DROP POLICY IF EXISTS "Staff can view access tokens in org" ON client_access_tokens;
        DROP POLICY IF EXISTS "Staff can create access tokens" ON client_access_tokens;
        DROP POLICY IF EXISTS "Staff can update access tokens in org" ON client_access_tokens;

        EXECUTE 'CREATE POLICY "Staff can view access tokens in org" ON client_access_tokens
            FOR SELECT USING (
                organization_id = (select get_user_organization_id())
                AND EXISTS (
                    SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN (''admin'', ''owner'', ''developer'', ''contractor'')
                )
            )';

        EXECUTE 'CREATE POLICY "Staff can create access tokens" ON client_access_tokens
            FOR INSERT WITH CHECK (
                organization_id = (select get_user_organization_id())
                AND EXISTS (
                    SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN (''admin'', ''owner'', ''developer'', ''contractor'')
                )
            )';

        EXECUTE 'CREATE POLICY "Staff can update access tokens in org" ON client_access_tokens
            FOR UPDATE USING (
                organization_id = (select get_user_organization_id())
                AND EXISTS (
                    SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN (''admin'', ''owner'', ''developer'', ''contractor'')
                )
            )';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- USER_ONBOARDING policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their onboarding" ON user_onboarding;
CREATE POLICY "Users can view their onboarding" ON user_onboarding
    FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their onboarding" ON user_onboarding;
CREATE POLICY "Users can create their onboarding" ON user_onboarding
    FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their onboarding" ON user_onboarding;
CREATE POLICY "Users can update their onboarding" ON user_onboarding
    FOR UPDATE USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their onboarding" ON user_onboarding;
CREATE POLICY "Users can delete their onboarding" ON user_onboarding
    FOR DELETE USING (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- CONTRACTOR_RATES policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage contractor rates" ON contractor_rates;
CREATE POLICY "Admins can manage contractor rates" ON contractor_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = (select auth.uid())
            AND role IN ('developer', 'owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Contractors can view own rates" ON contractor_rates;
CREATE POLICY "Contractors can view own rates" ON contractor_rates
    FOR SELECT USING (contractor_id = (select auth.uid()));

-- ==============================================================================
-- PART 3: Remove Redundant Developer Policies (to fix multiple_permissive_policies)
-- The developer check is already included in the is_developer() function calls
-- and admin policies already include developers in their role checks
-- ==============================================================================

-- Note: Many of the "Developers can..." policies overlap with "Admins can..." policies
-- since developer is included in the role checks. We'll keep the developer policies
-- that use is_developer() as they provide cross-org access, but remove redundant ones.

-- Remove redundant SELECT-only policies where FOR ALL already covers them
DROP POLICY IF EXISTS "Developers can view all client_goals" ON client_goals;
DROP POLICY IF EXISTS "Developers can view all clients" ON clients;
DROP POLICY IF EXISTS "Developers can view all service_types" ON service_types;
DROP POLICY IF EXISTS "Developers can view all session_attendees" ON session_attendees;
DROP POLICY IF EXISTS "Developers can view all invoices" ON invoices;
DROP POLICY IF EXISTS "Developers can view all sessions" ON sessions;
DROP POLICY IF EXISTS "Developers can view all session reminders" ON session_reminders;

-- Remove redundant developer policies where "manage all" already exists
-- These tables have both "view all" and "manage all" which is redundant
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_resources') THEN
        DROP POLICY IF EXISTS "Developers can view all resources" ON client_resources;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_requests') THEN
        DROP POLICY IF EXISTS "Developers can view all session requests" ON session_requests;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_access_tokens') THEN
        DROP POLICY IF EXISTS "Developers can view all access tokens" ON client_access_tokens;
    END IF;
END $$;
