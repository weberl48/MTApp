-- Server-side error sink so production failures are visible somewhere.
--
-- WHY
-- `logger.error()` mirrors errors to the dev portal, but that forwarder is
-- guarded by `NODE_ENV !== 'development'` — so in production it returns
-- immediately and nothing is captured anywhere the team looks. Vercel's runtime
-- logs exist but are short-retention, unaggregated and un-alerted. With the
-- pilot starting, the first sign of a broken invoice send would otherwise be
-- Colleen noticing.
--
-- WHY A TABLE RATHER THAN A THIRD-PARTY SERVICE
-- Error text can incidentally carry PHI. Keeping it in the same Supabase
-- project that already holds the PHI adds no new compliance surface and needs
-- no BAA; the dev portal already reads this project through the Management API.
-- The app still writes only the PHI-safe { name, message } shape logger.ts
-- produces — this table is not a licence to log more.

CREATE TABLE IF NOT EXISTS public.app_errors (
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    environment  TEXT NOT NULL DEFAULT 'production',
    source       TEXT NOT NULL DEFAULT 'backend',
    kind         TEXT,
    message      TEXT NOT NULL,
    path         TEXT,
    -- Deliberately no user_id / org_id: this is an operational feed, and tying
    -- an error to a person is the kind of thing that turns a log into a record.
    CONSTRAINT app_errors_message_len CHECK (char_length(message) <= 4000)
);

-- The portal only ever asks for "most recent N".
CREATE INDEX IF NOT EXISTS app_errors_created_at_idx
    ON public.app_errors (created_at DESC);

ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;

-- Writes come from the service role (which bypasses RLS) via the app's own
-- fetch. No policy grants INSERT to end users: a browser must never be able to
-- stuff rows into this table.
DROP POLICY IF EXISTS "Developers and owners can read app errors" ON public.app_errors;
CREATE POLICY "Developers and owners can read app errors"
    ON public.app_errors FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('developer', 'owner')
        )
    );

-- Keep the table from growing without bound; 30 days is well past useful for
-- an operational feed.
CREATE OR REPLACE FUNCTION public.prune_app_errors()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    DELETE FROM public.app_errors WHERE created_at < NOW() - INTERVAL '30 days';
$$;
