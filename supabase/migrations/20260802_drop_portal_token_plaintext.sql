-- ============================================================================
-- CONTRACT half of the portal-token hashing change.
--
-- DO NOT APPLY until BOTH are true:
--   1. 20260802_hash_portal_tokens.sql has been applied and verified
--      (SELECT count(*) FILTER (WHERE token_hash IS NULL) FROM client_access_tokens
--       returns 0), and
--   2. the app version that reads by token_hash has been deployed and a real
--      portal link has been opened end-to-end against it.
--
-- Dropping this column is the point of the exercise: until it is gone, the
-- plaintext bearer credentials are still sitting in the table and in every
-- backup taken since. After it is gone, a database compromise no longer hands
-- the attacker working portal access.
--
-- This is irreversible — existing portal links keep working (the hash is what
-- is checked), but the raw tokens cannot be recovered from the database.
-- ============================================================================

ALTER TABLE client_access_tokens DROP COLUMN IF EXISTS token;
