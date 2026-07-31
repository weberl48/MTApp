-- Session location on batch invoice line items + admin-only service types.
-- Spec: docs/superpowers/specs/2026-07-31-session-location-design.md
--
-- Apply BY HAND to cert (gzrukevymmguqxuoynqk) first, verify, then prod
-- (ysmwowzxkgisshaormmf). There is no schema_migrations table in this project.

-- Batch invoices render from denormalised invoice_items rows, so the location has
-- to be snapshotted at generation time alongside service_type_name/contractor_name.
-- Single-session invoices need no column: they join sessions.classroom directly.
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS classroom text;

COMMENT ON COLUMN invoice_items.classroom IS
  'Session location snapshotted at batch-invoice generation, mirroring service_type_name/contractor_name.';

-- Role-based replacement for hand-enumerated allowed_contractor_ids allowlists.
-- allowed_contractor_ids is retained: it still expresses "only these specific
-- contractors", which admin_only does not cover.
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS admin_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN service_types.admin_only IS
  'Hide this service type from contractors in the session form. Admins/owners always see everything.';
