-- Restrict Contractor Client Access
-- Contractors should only see clients they've had sessions with
-- ==============================================================================

-- ==============================================================================
-- UPDATE CLIENTS RLS POLICIES
-- ==============================================================================

-- Drop the existing broad policy that lets all users see all clients
DROP POLICY IF EXISTS "Users can view clients in org" ON clients;

-- Admins, owners, and developers can view all clients in their org
CREATE POLICY "Admins can view all clients in org" ON clients
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
    );

-- Contractors can only view clients they've had sessions with
CREATE POLICY "Contractors can view own clients" ON clients
    FOR SELECT USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'contractor'
        )
        AND EXISTS (
            SELECT 1 FROM session_attendees sa
            JOIN sessions s ON s.id = sa.session_id
            WHERE sa.client_id = clients.id
            AND s.contractor_id = auth.uid()
        )
    );

-- ==============================================================================
-- UPDATE SESSION ATTENDEES POLICIES FOR CONTRACTORS
-- ==============================================================================

-- Contractors should also only be able to add attendees who are their clients
-- (clients they've previously worked with) OR for new sessions they're creating

-- Drop and recreate the insert policy to be more permissive for new client assignments
DROP POLICY IF EXISTS "Insert attendees for own sessions in org" ON session_attendees;

CREATE POLICY "Insert attendees for own sessions in org" ON session_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.organization_id = get_user_organization_id()
            AND s.contractor_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = client_id
            AND c.organization_id = get_user_organization_id()
        )
    );

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON POLICY "Admins can view all clients in org" ON clients IS
    'Admins, owners, and developers can see all clients in their organization';

COMMENT ON POLICY "Contractors can view own clients" ON clients IS
    'Contractors can only see clients they have conducted sessions with';
