-- Scope login_attempts reads by organization so an admin of one org can't read another org's
-- login emails / IP addresses. The table had no organization_id and the SELECT policy filtered
-- on role only.
ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Backfill existing rows from the matching user's org (by email).
UPDATE login_attempts la
SET organization_id = u.organization_id
FROM users u
WHERE lower(la.email) = lower(u.email) AND la.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_login_attempts_org ON login_attempts(organization_id);

-- Replace the role-only SELECT policy with an org-scoped one (developers keep cross-org access).
DROP POLICY IF EXISTS "Admins can read login attempts" ON login_attempts;
CREATE POLICY "Admins can read login attempts in org" ON login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid()) AND users.role = 'developer'::user_role
    )
    OR (
      organization_id = (SELECT get_user_organization_id())
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = (SELECT auth.uid())
          AND users.role = ANY (ARRAY['admin'::user_role, 'owner'::user_role])
      )
    )
  );
