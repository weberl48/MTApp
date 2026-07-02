-- Add missing DELETE policy for sessions table
-- The 20250202_fix_rls_performance migration split the original "Admins can manage sessions in org"
-- FOR ALL policy into separate FOR SELECT and FOR UPDATE policies, but omitted FOR DELETE.

DROP POLICY IF EXISTS "Admins can delete sessions in org" ON sessions;
CREATE POLICY "Admins can delete sessions in org" ON sessions
    FOR DELETE USING (
        organization_id = (select get_user_organization_id())
        AND EXISTS (
            SELECT 1 FROM users WHERE id = (select auth.uid()) AND role IN ('admin', 'owner', 'developer')
        )
    );
