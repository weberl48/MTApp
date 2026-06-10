-- Fix session reminders: correct timing (#18) and stop duplicate reminders on edit (#26).
--
-- #18: the trigger anchored the reminder at "NEW.date 09:00:00" cast to TIMESTAMPTZ — i.e. 9 AM
--      in the DB timezone (UTC) — ignoring the session's actual `time`. With reminder_hours=24
--      a Wed 3 PM ET session was reminded ~4-5 AM ET Tuesday (≈34h early). Anchor at the
--      session's real date+time interpreted in Eastern time.
-- #26: the INSERT used `ON CONFLICT DO NOTHING`, but session_reminders has no unique constraint,
--      so it never suppressed anything — editing a future submitted session inserted another
--      pending reminder each time (→ duplicate emails). Delete the existing pending reminder for
--      this session before inserting, so an edit reschedules instead of duplicating.
CREATE OR REPLACE FUNCTION create_session_reminders()
RETURNS TRIGGER AS $$
DECLARE
    org_settings JSONB;
    session_date TIMESTAMPTZ;
    contractor_email TEXT;
    contractor_name TEXT;
    reminder_hours INTEGER;
BEGIN
    IF NEW.status = 'submitted' AND NEW.date >= CURRENT_DATE THEN
        SELECT settings INTO org_settings
        FROM public.organizations
        WHERE id = NEW.organization_id;

        SELECT email, name INTO contractor_email, contractor_name
        FROM public.users
        WHERE id = NEW.contractor_id;

        -- Anchor at the session's real date + time, interpreted in Eastern time.
        session_date := ((NEW.date || ' ' || COALESCE(NEW.time::text, '09:00:00'))::timestamp
                          AT TIME ZONE 'America/New_York');

        reminder_hours := COALESCE((org_settings->'session'->>'reminder_hours')::INTEGER, 24);

        -- Replace any existing pending reminder for this session so re-saving / rescheduling does
        -- not accumulate duplicates.
        DELETE FROM public.session_reminders
        WHERE session_id = NEW.id
          AND reminder_type = 'contractor_reminder'
          AND status = 'pending';

        INSERT INTO public.session_reminders (
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
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
