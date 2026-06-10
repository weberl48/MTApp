-- Allow contractors to create per-session invoices for THEIR OWN sessions.
--
-- The invoices table only had an INSERT policy for admins/owners/developers. When a
-- contractor logged and submitted their own session, the client-side per-session invoice
-- insert (src/lib/session-form/create-session.ts) was silently denied by RLS, the error was
-- swallowed, and the session was never billed — a revenue leak. The session and attendee
-- inserts already have contractor policies; this closes the gap for invoices.
--
-- Scope is tight: a contractor may insert an invoice only when it is for a session they own,
-- in their own organization. Admin/owner/developer inserts continue via their existing
-- "Admins can manage invoices in org" / "Developers can manage all invoices" policies
-- (permissive policies are OR'd).
CREATE POLICY "Contractors can create invoices for own sessions" ON invoices
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT get_user_organization_id())
    AND EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = invoices.session_id
        AND s.contractor_id = (SELECT auth.uid())
        AND s.organization_id = invoices.organization_id
    )
  );
