-- User-filed bug reports, plus the private bucket their screenshots live in.
--
-- WHY A SECOND TABLE RATHER THAN ROWS IN app_errors
-- app_errors is ambient machine telemetry: deliberately anonymous (its migration
-- says so in as many words), 30-day retention, no lifecycle. A bug report is the
-- opposite on every axis — voluntary, attributed (you need to know who to ask a
-- follow-up question), carries a screenshot, and outlives a month because it is
-- tracked as a GitHub issue. Merging them would force one set of rules onto two
-- different things.
--
-- THE PHI BOUNDARY
-- `description` is free text a user typed while looking at a client's record, so
-- it will contain client names. It is encrypted at rest exactly like
-- sessions.notes. Screenshots are PHI outright — a capture of the sessions list
-- is a client roster — so the bucket is private and reached only through
-- short-TTL signed URLs. Neither ever reaches GitHub: the auto-filed issue
-- carries only generated fields (route PATTERN, role, browser, commit), so there
-- is no redaction step that can silently fail.

CREATE TABLE IF NOT EXISTS public.bug_reports (
    id                  BIGSERIAL PRIMARY KEY,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    -- Nullable + SET NULL: a contractor leaving must not delete the evidence of
    -- the bugs they found.
    user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
    -- Snapshotted, because roles change and "what could they see" is the whole
    -- context for a permissions bug.
    user_role           TEXT,

    environment         TEXT NOT NULL DEFAULT 'production',

    -- ENCRYPTED. Never select this into anything that leaves the server without
    -- decryptField() — and never put the decrypted value in a GitHub issue.
    description         TEXT NOT NULL,

    -- '/invoices/[id]/' — the id-free form, and the only location GitHub sees.
    route_pattern       TEXT,
    -- The real URL, ids and all. Stays here.
    url                 TEXT,

    user_agent          TEXT,
    viewport            TEXT,
    -- VERCEL_GIT_COMMIT_SHA: pins the report to a deploy, which is the
    -- difference between "can't reproduce" and "fixed three commits ago".
    app_commit          TEXT,

    -- Last few client-side errors from the same session:
    --   [{ kind, at, message }]
    -- `message` is ENCRYPTED, element by element. A message is whatever the app
    -- passed to console.error, and `console.error('Failed to save ' +
    -- clientName)` is ordinary code — so it is potential PHI and gets exactly
    -- the same treatment as `description`. `kind` and `at` are machine-generated
    -- and stay plaintext so they remain queryable without the key.
    recent_errors       JSONB NOT NULL DEFAULT '[]'::jsonb,

    screenshot_path     TEXT,

    -- Null when GitHub was unreachable. The report still lands; filing is
    -- best-effort and must never be able to lose the user's words.
    github_issue_number INTEGER,
    github_issue_url    TEXT,

    CONSTRAINT bug_reports_description_len CHECK (char_length(description) <= 8000)
);

-- The portal only ever asks for "most recent N".
CREATE INDEX IF NOT EXISTS bug_reports_created_at_idx
    ON public.bug_reports (created_at DESC);

-- Durable marker for anyone reading the live schema rather than this file.
COMMENT ON COLUMN public.bug_reports.description IS
    'ENCRYPTED (encryptField). User-authored free text — contains client names.';
COMMENT ON COLUMN public.bug_reports.recent_errors IS
    'JSONB [{kind, at, message}]. message is ENCRYPTED per element; kind/at are plaintext.';

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Deliberately NO insert policy. `description` must be encrypted with the
-- server-only ENCRYPTION_KEY, so writes go through submitBugReport() using the
-- service client (which bypasses RLS). A browser that could insert here directly
-- would be storing PHI in plaintext.
DROP POLICY IF EXISTS "Developers and owners can read bug reports" ON public.bug_reports;
CREATE POLICY "Developers and owners can read bug reports"
    ON public.bug_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('developer', 'owner')
        )
    );

-- ==============================================================================
-- Screenshot bucket
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bug-screenshots',
    'bug-screenshots',
    false,   -- private; signed URLs only
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- No policies on storage.objects for this bucket at all: uploads and signed-URL
-- minting both happen server-side with the service role. Nothing in a browser
-- should be able to list or fetch another user's screenshot.

-- ==============================================================================
-- Retention
-- ==============================================================================

-- Screenshots are the PHI-densest artifact and stop being useful once a report
-- is triaged, so they go first and the row survives them. The row itself lasts a
-- year — long enough to still resolve a GitHub issue's deep link, short enough
-- not to accumulate encrypted PHI indefinitely.
--
-- THIS FUNCTION DELETES ROWS ONLY. It deliberately does NOT null
-- screenshot_path: a screenshot is reachable only through that pointer, so
-- clearing it for a file that was not actually deleted strands client PHI in the
-- bucket with nothing referencing it. Only the cleanup cron can talk to storage,
-- so only the cron may clear a pointer — and only for paths storage confirmed it
-- removed. An earlier version of this function nulled pointers on a timer, which
-- made exactly that orphan possible.
CREATE OR REPLACE FUNCTION public.prune_bug_reports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- `screenshot_path IS NULL` is the guard, not an optimisation: a year-old
    -- row that still points at a file means deletion has been failing, and
    -- dropping the row would lose the only reference to it. Leave it — the row
    -- persisting is the visible symptom, which is what we want.
    DELETE FROM public.bug_reports
     WHERE created_at < NOW() - INTERVAL '1 year'
       AND screenshot_path IS NULL;
END;
$$;
