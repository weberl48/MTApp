-- ============================================================================
-- Security audit 2026-08-02 — store client portal tokens hashed.
--
-- APPLY TO CERT FIRST, VERIFY, THEN PROD. Applied by hand (see CLAUDE.md).
--
-- WHY
-- client_access_tokens.token held the raw 32-byte bearer credential that grants
-- read access to a client's sessions, goals, resources and decrypted
-- client_notes, for 90 days. Any read of that table — a DB compromise, a
-- backup, a support export, the cert copy of production — yielded working
-- credentials for every client portal in the system. A password would never be
-- stored this way; a 90-day bearer token for PHI deserves the same treatment.
--
-- SHA-256 (not bcrypt/argon2) is the right primitive here: the input is 256 bits
-- of CSPRNG output, so there is nothing to brute-force and a slow KDF would only
-- add latency to every portal request.
--
-- EXPAND / CONTRACT
-- This is the EXPAND half: add token_hash, backfill it, index it. The `token`
-- column is left in place and made nullable so a rollback is possible and any
-- in-flight deploy keeps working. Run 20260802_drop_portal_token_plaintext.sql
-- to CONTRACT once the app has been verified against the hash path.
-- ============================================================================

-- pgcrypto provides digest(); Supabase ships it in the extensions schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE client_access_tokens
    ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- Backfill existing tokens. Must match the app's hashing exactly:
-- sha256(token) rendered as lowercase hex — see hashPortalToken() in
-- src/lib/portal/token.ts.
UPDATE client_access_tokens
SET token_hash = encode(extensions.digest(token, 'sha256'), 'hex')
WHERE token_hash IS NULL
  AND token IS NOT NULL;

-- The lookup index. UNIQUE because the old `token` column was UNIQUE and the
-- hash of a unique value is unique; this also stops a duplicate slipping in.
CREATE UNIQUE INDEX IF NOT EXISTS client_access_tokens_token_hash_key
    ON client_access_tokens (token_hash);

-- New rows written by the app carry token_hash and leave token NULL, so the old
-- NOT NULL constraint has to go.
ALTER TABLE client_access_tokens
    ALTER COLUMN token DROP NOT NULL;

COMMENT ON COLUMN client_access_tokens.token_hash IS
    'sha256(token) as lowercase hex. The raw token exists only in the emailed portal link (security audit 2026-08-02).';
COMMENT ON COLUMN client_access_tokens.token IS
    'DEPRECATED plaintext bearer token. NULL for rows created after 2026-08-02. Dropped by 20260802_drop_portal_token_plaintext.sql.';


-- ----------------------------------------------------------------------------
-- VERIFY before contracting:
--   -- every row has a hash
--   SELECT count(*) FILTER (WHERE token_hash IS NULL) AS missing_hash
--   FROM client_access_tokens;
--
--   -- and an existing portal link still opens (exercise a real link end-to-end)
-- ----------------------------------------------------------------------------
