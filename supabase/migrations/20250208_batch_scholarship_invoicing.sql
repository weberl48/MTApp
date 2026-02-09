-- Migration: Batch Scholarship Invoicing
-- Adds invoice_items table and modifies invoices table to support
-- monthly batch invoices where each session is an itemized line item.

-- 1. Make session_id nullable on invoices (batch invoices span multiple sessions)
ALTER TABLE invoices ALTER COLUMN session_id DROP NOT NULL;

-- 2. Add invoice_type column to distinguish per-session vs batch invoices
ALTER TABLE invoices ADD COLUMN invoice_type TEXT NOT NULL DEFAULT 'session';

-- 3. Add billing_period for batch invoices (e.g., '2026-02')
ALTER TABLE invoices ADD COLUMN billing_period TEXT;

-- 4. Create invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id),
    description TEXT NOT NULL,
    session_date DATE NOT NULL,
    duration_minutes INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    mca_cut DECIMAL(10,2) NOT NULL DEFAULT 0,
    contractor_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
    rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    service_type_name TEXT,
    contractor_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_session ON invoice_items(session_id);
CREATE INDEX idx_invoices_billing_period ON invoices(billing_period) WHERE billing_period IS NOT NULL;
CREATE INDEX idx_invoices_type ON invoices(invoice_type);

-- 6. Unique constraint: one batch invoice per client per billing period per org
CREATE UNIQUE INDEX idx_invoices_batch_unique
    ON invoices(client_id, billing_period, organization_id)
    WHERE invoice_type = 'batch';

-- 7. RLS for invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice items in org" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_id
            AND i.organization_id = get_user_organization_id()
            AND EXISTS (
                SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner', 'developer')
            )
        )
    );

CREATE POLICY "Contractors can view invoice items for their sessions" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.contractor_id = auth.uid()
        )
    );

CREATE POLICY "Developers can manage all invoice items" ON invoice_items
    FOR ALL USING (is_developer());
