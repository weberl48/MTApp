-- Track login attempts for account lockout
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address text,
  attempted_at timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

-- Index for fast lookups by email and time
CREATE INDEX idx_login_attempts_email_time ON login_attempts(email, attempted_at DESC);

-- Allow anonymous inserts (login happens before auth)
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Anon users can insert attempts (needed for login flow)
CREATE POLICY "Anyone can insert login attempts"
  ON login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users with admin roles can read attempts
CREATE POLICY "Admins can read login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('developer', 'owner', 'admin')
    )
  );

-- Service role can read for lockout checks (used by API route)
-- Note: service role bypasses RLS by default

-- Auto-cleanup: delete records older than 30 days
-- This should be run as a scheduled job (e.g., Supabase cron or pg_cron)
-- DELETE FROM login_attempts WHERE attempted_at < now() - interval '30 days';
