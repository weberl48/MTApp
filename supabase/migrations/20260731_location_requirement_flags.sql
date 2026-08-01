-- ============================================================================
-- Session-location requirement flags — 2026-07-31
-- ============================================================================
-- APPLY BY HAND via the Supabase SQL editor or Management API (project is not
-- `supabase link`ed; no schema_migrations table). Idempotent: safe to re-run.
-- Apply to cert (gzrukevymmguqxuoynqk) first, verify, then prod (ysmwowzxkgisshaormmf).
--
-- Replaces the settings-based picklist machinery shipped earlier today
-- (20260731_session_location_and_admin_services.sql + the 2026-07-31
-- session-location spec, superseded same day): two booleans instead of
-- per-client JSONB config.
--   * service_types.requires_classroom — sessions of this service must record
--     a free-text Classroom (e.g. "In-school group session").
--   * clients.requires_location — sessions involving this client must record
--     a free-text Location (e.g. OLV, People Inc).
-- Values still land in sessions.classroom / invoice_items.classroom.
-- Stale settings JSONB keys (custom_lists.classrooms / classrooms_by_client /
-- locations_by_client, invoice.show_session_location) are ignored by the new
-- code; no data migration required.
-- ============================================================================

ALTER TABLE service_types ADD COLUMN IF NOT EXISTS requires_classroom boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN service_types.requires_classroom IS
  'Sessions of this service type must record a classroom (free text, required on the session form, printed on invoices).';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS requires_location boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN clients.requires_location IS
  'Sessions involving this client must record a location (free text, required on the session form, printed on invoices).';

-- ============================================================================
-- VERIFICATION (run separately after applying)
-- ============================================================================
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'service_types' AND column_name = 'requires_classroom';  -- 1 row
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'clients' AND column_name = 'requires_location';         -- 1 row
-- ============================================================================
-- FLAG SETTING is environment-specific and happens AFTER live-name verification
-- (see the rollout notes in the plan); do not bake names into this file.
-- ============================================================================
