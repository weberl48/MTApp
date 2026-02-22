-- Migration: Clean up orphaned data
-- Run in Supabase SQL Editor (or via CLI) to find and remove orphaned records
-- that reference deleted parent rows.
--
-- This script:
-- 1. Reports orphan counts (SELECT queries)
-- 2. Deletes orphaned records (DELETE queries)
--
-- Safe to run multiple times — idempotent.

-- ==============================================================================
-- STEP 1: REPORT — See what orphaned data exists before deleting
-- ==============================================================================

-- 1a. Invoices referencing a session that no longer exists
SELECT 'orphaned_invoices_missing_session' AS check_name, COUNT(*) AS orphan_count
FROM invoices i
WHERE i.session_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = i.session_id);

-- 1b. Invoice items referencing a session that no longer exists
SELECT 'orphaned_invoice_items_missing_session' AS check_name, COUNT(*) AS orphan_count
FROM invoice_items ii
WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = ii.session_id);

-- 1c. Invoice items referencing an invoice that no longer exists
--     (shouldn't happen due to ON DELETE CASCADE, but check anyway)
SELECT 'orphaned_invoice_items_missing_invoice' AS check_name, COUNT(*) AS orphan_count
FROM invoice_items ii
WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.id = ii.invoice_id);

-- 1d. Session attendees referencing a session that no longer exists
--     (shouldn't happen due to ON DELETE CASCADE, but check anyway)
SELECT 'orphaned_attendees_missing_session' AS check_name, COUNT(*) AS orphan_count
FROM session_attendees sa
WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sa.session_id);

-- 1e. Session attendees referencing a client that no longer exists
SELECT 'orphaned_attendees_missing_client' AS check_name, COUNT(*) AS orphan_count
FROM session_attendees sa
WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = sa.client_id);

-- 1f. Invoices referencing a client that no longer exists
SELECT 'orphaned_invoices_missing_client' AS check_name, COUNT(*) AS orphan_count
FROM invoices i
WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = i.client_id);

-- 1g. Sessions referencing a service_type that no longer exists
SELECT 'orphaned_sessions_missing_service_type' AS check_name, COUNT(*) AS orphan_count
FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM service_types st WHERE st.id = s.service_type_id);

-- 1h. Sessions referencing a contractor (user) that no longer exists
SELECT 'orphaned_sessions_missing_contractor' AS check_name, COUNT(*) AS orphan_count
FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.contractor_id);

-- 1i. Session reminders referencing a session that no longer exists
--     (shouldn't happen due to ON DELETE CASCADE, but check anyway)
SELECT 'orphaned_reminders_missing_session' AS check_name, COUNT(*) AS orphan_count
FROM session_reminders sr
WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sr.session_id);

-- 1j. Session requests with created_session_id pointing to a deleted session
SELECT 'orphaned_session_requests_missing_session' AS check_name, COUNT(*) AS orphan_count
FROM session_requests sr
WHERE sr.created_session_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sr.created_session_id);

-- 1k. Batch invoices with no remaining invoice_items (empty batch)
SELECT 'empty_batch_invoices' AS check_name, COUNT(*) AS orphan_count
FROM invoices i
WHERE i.invoice_type = 'batch'
  AND i.session_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id);

-- 1l. Sessions with no invoices AND no invoice_items referencing them
SELECT 'sessions_without_invoices' AS check_name, COUNT(*) AS orphan_count
FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.session_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.session_id = s.id);

-- 1m. Payroll entries (paid sessions) with no invoices
SELECT 'paid_sessions_without_invoices' AS check_name, COUNT(*) AS orphan_count
FROM sessions s
WHERE s.contractor_paid_date IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.session_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.session_id = s.id);

-- 1n. Per-session invoices that lost their session reference (session_id is NULL
--     but invoice_type is 'session' — should always have a session_id)
SELECT 'per_session_invoices_missing_session_id' AS check_name, COUNT(*) AS orphan_count
FROM invoices i
WHERE i.invoice_type = 'session'
  AND i.session_id IS NULL;

-- 1o. Invoices with no session AND no invoice_items (floating invoices)
--     Excludes valid batch invoices that still have items
SELECT 'invoices_with_no_session_or_items' AS check_name, COUNT(*) AS orphan_count
FROM invoices i
WHERE i.session_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id);

-- ==============================================================================
-- STEP 2: CLEANUP — Delete orphaned records
-- ==============================================================================

-- 2a. Delete invoice items referencing deleted sessions
DELETE FROM invoice_items ii
WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = ii.session_id);

-- 2b. Delete invoice items referencing deleted invoices
DELETE FROM invoice_items ii
WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.id = ii.invoice_id);

-- 2c. Delete invoices referencing deleted sessions
DELETE FROM invoices i
WHERE i.session_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = i.session_id);

-- 2d. Delete empty batch invoices (no items left)
DELETE FROM invoices i
WHERE i.invoice_type = 'batch'
  AND i.session_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id);

-- 2e. Delete session attendees referencing deleted sessions
DELETE FROM session_attendees sa
WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sa.session_id);

-- 2f. Delete session attendees referencing deleted clients
DELETE FROM session_attendees sa
WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = sa.client_id);

-- 2g. Delete invoices referencing deleted clients
DELETE FROM invoices i
WHERE NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = i.client_id);

-- 2h. Delete session reminders referencing deleted sessions
DELETE FROM session_reminders sr
WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sr.session_id);

-- 2i. Clear session_requests.created_session_id for deleted sessions
UPDATE session_requests sr
SET created_session_id = NULL
WHERE sr.created_session_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sr.created_session_id);

-- 2j. Delete per-session invoices that lost their session reference
--     (invoice_type = 'session' but session_id is NULL — should never happen)
DELETE FROM invoices i
WHERE i.invoice_type = 'session'
  AND i.session_id IS NULL;

-- 2k. Delete floating invoices with no session and no invoice_items
--     (orphaned invoices not linked to anything)
DELETE FROM invoices i
WHERE i.session_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id);

-- 2l. Delete sessions referencing deleted service types
--     (these sessions have no valid pricing config — can't be invoiced)
DELETE FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM service_types st WHERE st.id = s.service_type_id);

-- 2m. Delete sessions referencing deleted contractors
--     (these sessions have no valid owner)
DELETE FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = s.contractor_id);

-- 2n. Delete sessions that have no invoices and no invoice_items
--     (dead-end sessions with no billing records — includes orphaned payroll)
DELETE FROM sessions s
WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.session_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.session_id = s.id);

-- ==============================================================================
-- STEP 3: VERIFY — Confirm everything is clean
-- ==============================================================================

SELECT 'VERIFICATION' AS status,
  (SELECT COUNT(*) FROM invoices i WHERE i.session_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = i.session_id)) AS orphaned_invoices,
  (SELECT COUNT(*) FROM invoice_items ii WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = ii.session_id)) AS orphaned_items,
  (SELECT COUNT(*) FROM session_attendees sa WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sa.session_id)) AS orphaned_attendees,
  (SELECT COUNT(*) FROM session_reminders sr WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = sr.session_id)) AS orphaned_reminders,
  (SELECT COUNT(*) FROM sessions s WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.session_id = s.id) AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.session_id = s.id)) AS sessions_without_invoices,
  (SELECT COUNT(*) FROM invoices i WHERE i.session_id IS NULL AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id)) AS floating_invoices;
