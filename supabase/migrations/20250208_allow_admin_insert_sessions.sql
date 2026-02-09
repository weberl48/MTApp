-- Allow admins/owners/developers to create sessions for any contractor in their org.
-- Previously only the contractor INSERT policy existed (contractor_id = auth.uid()),
-- which blocked owners from creating sessions on behalf of contractors via "View As".

CREATE POLICY "Admins can insert sessions in org" ON sessions
    FOR INSERT WITH CHECK (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );
