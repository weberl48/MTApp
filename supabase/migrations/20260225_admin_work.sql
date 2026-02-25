-- Migration: Add admin_work table for non-client administrative task tracking
-- Separate from sessions to avoid confusion between client sessions and admin tasks

CREATE TYPE admin_work_status AS ENUM ('draft', 'submitted', 'approved');

CREATE TABLE admin_work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    description TEXT NOT NULL,
    pay_amount DECIMAL(10,2) NOT NULL,
    status admin_work_status NOT NULL DEFAULT 'draft',
    paid_date DATE,
    paid_amount DECIMAL(10,2),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_work_org ON admin_work(organization_id);
CREATE INDEX idx_admin_work_admin_user ON admin_work(admin_user_id);
CREATE INDEX idx_admin_work_date ON admin_work(date DESC);
CREATE INDEX idx_admin_work_status ON admin_work(status);
CREATE INDEX idx_admin_work_unpaid ON admin_work(paid_date) WHERE paid_date IS NULL;

-- Enable RLS
ALTER TABLE admin_work ENABLE ROW LEVEL SECURITY;

-- Admins/owners/developers can do everything within their org
CREATE POLICY "Admins can view admin work in org" ON admin_work
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Admins can insert admin work in org" ON admin_work
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Admins can update admin work in org" ON admin_work
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
    );

CREATE POLICY "Admins can delete admin work in org" ON admin_work
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
    );

-- updated_at trigger
CREATE TRIGGER admin_work_updated_at
    BEFORE UPDATE ON admin_work
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
