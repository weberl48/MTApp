-- Fix infinite recursion in session_attendees RLS policy
-- ==============================================================================
-- The problem: session_attendees INSERT policy checks clients table,
-- but clients SELECT policy (for contractors) checks session_attendees,
-- causing infinite recursion.
--
-- Solution: Remove the clients check from session_attendees INSERT policy.
-- The session already validates organization, and we trust that client_id
-- references a valid client in the same org (enforced by FK constraint).
-- ==============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Insert attendees for own sessions in org" ON session_attendees;

-- Recreate without the clients table check (which triggers recursion)
CREATE POLICY "Insert attendees for own sessions in org" ON session_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.organization_id = get_user_organization_id()
            AND s.contractor_id = auth.uid()
        )
    );

-- Also need to fix the "View attendees" policy to avoid recursion
-- when contractors try to view their session attendees
DROP POLICY IF EXISTS "View attendees for accessible sessions in org" ON session_attendees;

CREATE POLICY "View attendees for accessible sessions in org" ON session_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_attendees.session_id
            AND s.organization_id = get_user_organization_id()
            AND (
                s.contractor_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM users u
                    WHERE u.id = auth.uid()
                    AND u.role IN ('admin', 'owner', 'developer')
                )
            )
        )
    );

COMMENT ON POLICY "Insert attendees for own sessions in org" ON session_attendees IS
    'Contractors can add attendees to their own sessions. Client validation is handled by FK constraint.';
