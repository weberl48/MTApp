-- Performance indexes for frequently queried columns
-- These improve query performance for list pages and filters

-- Sessions: Often filtered by organization and sorted by date
CREATE INDEX IF NOT EXISTS idx_sessions_org_date ON sessions(organization_id, date DESC);

-- Invoices: Often filtered by organization and status
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id, status);

-- Users: Often filtered by organization
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);

-- Clients: Often filtered by organization
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(organization_id);

-- Client access tokens: Often checked for active (non-revoked) tokens
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_active ON client_access_tokens(client_id)
WHERE is_revoked = false;

-- Session attendees: Often joined with sessions
CREATE INDEX IF NOT EXISTS idx_session_attendees_session ON session_attendees(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendees_client ON session_attendees(client_id);

-- Invoices: Often filtered by client
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

-- Invoices: Often filtered by due date for overdue checks
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status = 'sent';
