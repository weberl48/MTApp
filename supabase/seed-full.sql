-- Full seed data for May Creative Arts development
-- Run this in Supabase SQL Editor AFTER you have:
-- 1. Run the schema
-- 2. Created at least one user account via the app
-- 3. Run the service types insert

-- First, let's create some contractor users in the users table
-- (These reference auth.users, so we'll create placeholder entries)

-- Get the first admin user ID to use as contractor
DO $$
DECLARE
    admin_user_id UUID;
    contractor1_id UUID := 'a1000000-0000-0000-0000-000000000001';
    contractor2_id UUID := 'a2000000-0000-0000-0000-000000000002';
    service_type_individual UUID;
    service_type_group UUID;
    service_type_matts UUID;
    service_type_art UUID;
BEGIN
    -- Get your user ID (the admin)
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;

    -- Get service type IDs
    SELECT id INTO service_type_individual FROM service_types WHERE name LIKE '%In-Home Individual%' LIMIT 1;
    SELECT id INTO service_type_group FROM service_types WHERE name LIKE '%In-Home Group%' LIMIT 1;
    SELECT id INTO service_type_matts FROM service_types WHERE name LIKE '%Matt%Individual%' LIMIT 1;
    SELECT id INTO service_type_art FROM service_types WHERE name LIKE '%Art Lesson%' AND category = 'art_individual' LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found. Please create an account and set role to admin first.';
    END IF;

    IF service_type_individual IS NULL THEN
        RAISE EXCEPTION 'Service types not found. Please run the service types insert first.';
    END IF;

    RAISE NOTICE 'Using admin_user_id: %', admin_user_id;
    RAISE NOTICE 'Using service_type_individual: %', service_type_individual;

END $$;

-- Insert sessions (using a simpler approach with direct queries)
-- We'll insert sessions for the past 3 months

-- First, create a temp table to hold our dynamic IDs
CREATE TEMP TABLE temp_ids AS
SELECT
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as contractor_id,
    (SELECT id FROM service_types WHERE name LIKE '%In-Home Individual%' LIMIT 1) as st_individual,
    (SELECT id FROM service_types WHERE name LIKE '%In-Home Group%' LIMIT 1) as st_group,
    (SELECT id FROM service_types WHERE name LIKE '%Matt%' AND category = 'music_individual' LIMIT 1) as st_matts,
    (SELECT id FROM service_types WHERE category = 'art_individual' LIMIT 1) as st_art;

-- Insert sessions for the past 3 months
INSERT INTO sessions (id, contractor_id, service_type_id, date, duration, status, notes)
SELECT
    gen_random_uuid(),
    (SELECT contractor_id FROM temp_ids),
    service_type_id,
    session_date,
    duration,
    status,
    notes
FROM (
    VALUES
        -- November sessions
        ((SELECT st_individual FROM temp_ids), '2024-11-05'::date, 30, 'approved', 'Great progress on breathing exercises'),
        ((SELECT st_individual FROM temp_ids), '2024-11-08'::date, 30, 'approved', 'Worked on vocal warm-ups'),
        ((SELECT st_group FROM temp_ids), '2024-11-12'::date, 45, 'approved', 'Group rhythm session - 3 participants'),
        ((SELECT st_matts FROM temp_ids), '2024-11-15'::date, 30, 'approved', 'Guitar chord practice'),
        ((SELECT st_individual FROM temp_ids), '2024-11-19'::date, 30, 'approved', 'Song learning session'),
        ((SELECT st_art FROM temp_ids), '2024-11-22'::date, 45, 'approved', 'Watercolor techniques'),
        ((SELECT st_group FROM temp_ids), '2024-11-26'::date, 60, 'approved', 'Holiday music preparation - 4 participants'),

        -- December sessions
        ((SELECT st_individual FROM temp_ids), '2024-12-03'::date, 30, 'approved', 'Continued song practice'),
        ((SELECT st_matts FROM temp_ids), '2024-12-05'::date, 30, 'approved', 'New chord progressions'),
        ((SELECT st_group FROM temp_ids), '2024-12-10'::date, 45, 'approved', 'Winter concert rehearsal - 5 participants'),
        ((SELECT st_individual FROM temp_ids), '2024-12-12'::date, 30, 'approved', 'Performance preparation'),
        ((SELECT st_art FROM temp_ids), '2024-12-15'::date, 60, 'approved', 'Holiday art project'),
        ((SELECT st_individual FROM temp_ids), '2024-12-17'::date, 30, 'approved', 'Final session before break'),

        -- January sessions (current month - mix of statuses)
        ((SELECT st_individual FROM temp_ids), '2025-01-07'::date, 30, 'approved', 'New year goal setting'),
        ((SELECT st_group FROM temp_ids), '2025-01-09'::date, 45, 'approved', 'Group welcome back session'),
        ((SELECT st_matts FROM temp_ids), '2025-01-14'::date, 30, 'approved', 'Advanced techniques'),
        ((SELECT st_individual FROM temp_ids), '2025-01-16'::date, 30, 'submitted', 'Regular session'),
        ((SELECT st_art FROM temp_ids), '2025-01-18'::date, 45, 'submitted', 'New art series started'),
        ((SELECT st_individual FROM temp_ids), '2025-01-21'::date, 30, 'draft', 'Upcoming session')
) AS v(service_type_id, session_date, duration, status, notes);

-- Now insert session attendees (link clients to sessions)
-- Get session IDs and assign clients
INSERT INTO session_attendees (session_id, client_id, individual_cost)
SELECT
    s.id,
    c.client_id,
    CASE
        WHEN st.category = 'music_group' OR st.category = 'art_group'
        THEN st.base_rate + (st.per_person_rate * 2) / 3  -- Split cost for groups
        ELSE st.base_rate
    END as individual_cost
FROM sessions s
JOIN service_types st ON s.service_type_id = st.id
CROSS JOIN LATERAL (
    SELECT id as client_id FROM clients
    ORDER BY random()
    LIMIT CASE WHEN st.category LIKE '%group%' THEN 3 ELSE 1 END
) c;

-- Create invoices for approved sessions
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, status, payment_method, due_date, paid_date)
SELECT
    gen_random_uuid(),
    s.id,
    sa.client_id,
    sa.individual_cost,
    ROUND(sa.individual_cost * (st.mca_percentage / 100.0), 2),
    CASE
        WHEN st.contractor_cap > 0 AND sa.individual_cost * (1 - st.mca_percentage / 100.0) > st.contractor_cap
        THEN st.contractor_cap
        ELSE ROUND(sa.individual_cost * (1 - st.mca_percentage / 100.0), 2)
    END,
    CASE
        WHEN s.date < CURRENT_DATE - INTERVAL '30 days' THEN 'paid'
        WHEN s.date < CURRENT_DATE - INTERVAL '7 days' THEN 'sent'
        ELSE 'pending'
    END,
    c.payment_method,
    s.date + INTERVAL '30 days',
    CASE
        WHEN s.date < CURRENT_DATE - INTERVAL '30 days' THEN s.date + INTERVAL '25 days'
        ELSE NULL
    END
FROM sessions s
JOIN session_attendees sa ON s.id = sa.session_id
JOIN clients c ON sa.client_id = c.id
JOIN service_types st ON s.service_type_id = st.id
WHERE s.status = 'approved';

-- Clean up temp table
DROP TABLE temp_ids;

-- Summary
SELECT
    'Sessions created: ' || COUNT(*) as summary
FROM sessions
UNION ALL
SELECT
    'Invoices created: ' || COUNT(*)
FROM invoices
UNION ALL
SELECT
    'Session attendees: ' || COUNT(*)
FROM session_attendees;
