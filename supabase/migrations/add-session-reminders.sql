-- Session Reminders System
-- Tracks scheduled reminders for upcoming sessions
-- ==============================================================================

-- Create reminder status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
        CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
    END IF;
END $$;

-- Create reminder type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_type') THEN
        CREATE TYPE reminder_type AS ENUM ('contractor_reminder', 'client_reminder', 'admin_notification');
    END IF;
END $$;

-- Create session_reminders table
CREATE TABLE IF NOT EXISTS session_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status reminder_status NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_session_reminders_organization ON session_reminders(organization_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_session ON session_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_status ON session_reminders(status);
CREATE INDEX IF NOT EXISTS idx_session_reminders_scheduled ON session_reminders(scheduled_for) WHERE status = 'pending';

-- RLS for session_reminders
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view reminders for their sessions
DROP POLICY IF EXISTS "Users can view own session reminders" ON session_reminders;
CREATE POLICY "Users can view own session reminders"
ON session_reminders FOR SELECT
USING (
    organization_id = get_user_organization_id()
    AND (
        -- Admins can see all
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('admin', 'owner', 'developer')
        )
        OR
        -- Contractors can see their own sessions
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND s.contractor_id = auth.uid()
        )
    )
);

-- Developers can view all reminders
DROP POLICY IF EXISTS "Developers can view all session reminders" ON session_reminders;
CREATE POLICY "Developers can view all session reminders"
ON session_reminders FOR SELECT
USING (is_developer());

-- Only admins can manage reminders
DROP POLICY IF EXISTS "Admins can manage reminders" ON session_reminders;
CREATE POLICY "Admins can manage reminders"
ON session_reminders FOR ALL
USING (
    organization_id = get_user_organization_id()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'owner', 'developer')
    )
);

-- Function to create reminders for a session
CREATE OR REPLACE FUNCTION create_session_reminders()
RETURNS TRIGGER AS $$
DECLARE
    org_settings JSONB;
    session_date TIMESTAMPTZ;
    contractor_email TEXT;
    contractor_name TEXT;
    reminder_hours INTEGER;
BEGIN
    -- Only create reminders for submitted sessions with future dates
    IF NEW.status = 'submitted' AND NEW.date >= CURRENT_DATE THEN
        -- Get organization settings
        SELECT settings INTO org_settings
        FROM organizations
        WHERE id = NEW.organization_id;

        -- Get contractor info
        SELECT email, name INTO contractor_email, contractor_name
        FROM users
        WHERE id = NEW.contractor_id;

        -- Create session datetime (assume 9 AM if no time specified)
        session_date := (NEW.date || ' 09:00:00')::TIMESTAMPTZ;

        -- Default to 24 hours before if not configured
        reminder_hours := COALESCE((org_settings->'session'->>'reminder_hours')::INTEGER, 24);

        -- Create contractor reminder
        INSERT INTO session_reminders (
            organization_id,
            session_id,
            reminder_type,
            recipient_email,
            recipient_name,
            scheduled_for,
            status
        ) VALUES (
            NEW.organization_id,
            NEW.id,
            'contractor_reminder',
            contractor_email,
            contractor_name,
            session_date - (reminder_hours || ' hours')::INTERVAL,
            'pending'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new sessions
DROP TRIGGER IF EXISTS create_reminders_on_session ON sessions;
CREATE TRIGGER create_reminders_on_session
    AFTER INSERT OR UPDATE OF status, date ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION create_session_reminders();

-- Function to cancel reminders when session is deleted or status changes
CREATE OR REPLACE FUNCTION cancel_session_reminders()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.status != 'submitted') THEN
        UPDATE session_reminders
        SET status = 'cancelled', updated_at = NOW()
        WHERE session_id = COALESCE(OLD.id, NEW.id)
        AND status = 'pending';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for cancelled/deleted sessions
DROP TRIGGER IF EXISTS cancel_reminders_on_session_change ON sessions;
CREATE TRIGGER cancel_reminders_on_session_change
    AFTER UPDATE OF status OR DELETE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION cancel_session_reminders();

-- Update organization settings to include reminder configuration
-- This adds reminder_hours to the session settings if not present
UPDATE organizations
SET settings = settings || '{"session": {"reminder_hours": 24}}'::jsonb
WHERE settings->'session'->>'reminder_hours' IS NULL;

-- Add comment
COMMENT ON TABLE session_reminders IS 'Tracks scheduled email reminders for upcoming sessions';
