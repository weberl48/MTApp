-- Seed data for May Creative Arts
-- Run this AFTER you have created a user account and have service types

-- Step 1: Get your user ID and service type IDs
-- Run this first to get the IDs you need:
-- SELECT id, name FROM service_types;
-- SELECT id, email FROM users;

-- Step 2: Insert sessions using the IDs from above
-- Replace the UUIDs below with your actual IDs

-- Create sessions
WITH my_ids AS (
    SELECT
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as contractor_id,
        (SELECT id FROM service_types WHERE name = 'In-Home Individual Session' LIMIT 1) as st_individual,
        (SELECT id FROM service_types WHERE name = 'In-Home Group Session' LIMIT 1) as st_group,
        (SELECT id FROM service_types WHERE name = 'Matt''s Music Individual' LIMIT 1) as st_matts,
        (SELECT id FROM service_types WHERE name = 'Individual Art Lesson' LIMIT 1) as st_art,
        (SELECT id FROM service_types WHERE name = 'Group Art Lesson' LIMIT 1) as st_art_group
)
INSERT INTO sessions (contractor_id, service_type_id, date, duration, status, notes)
SELECT contractor_id, service_type_id, session_date, duration, status::session_status, notes
FROM my_ids, (VALUES
    -- October 2024
    ('st_individual', '2024-10-07'::date, 30, 'approved', 'Initial assessment session'),
    ('st_individual', '2024-10-14'::date, 30, 'approved', 'Breathing exercises introduced'),
    ('st_group', '2024-10-21'::date, 45, 'approved', 'First group session - excellent participation'),
    ('st_matts', '2024-10-28'::date, 30, 'approved', 'Guitar basics - chord C and G'),

    -- November 2024
    ('st_individual', '2024-11-04'::date, 30, 'approved', 'Vocal warm-up techniques'),
    ('st_art', '2024-11-08'::date, 45, 'approved', 'Watercolor introduction'),
    ('st_group', '2024-11-11'::date, 45, 'approved', 'Rhythm exercises with drums'),
    ('st_individual', '2024-11-18'::date, 30, 'approved', 'Song learning - Amazing Grace'),
    ('st_matts', '2024-11-22'::date, 30, 'approved', 'Chord transitions practice'),
    ('st_art_group', '2024-11-25'::date, 60, 'approved', 'Thanksgiving art project'),

    -- December 2024
    ('st_individual', '2024-12-02'::date, 30, 'approved', 'Holiday song preparation'),
    ('st_group', '2024-12-05'::date, 45, 'approved', 'Winter concert rehearsal'),
    ('st_individual', '2024-12-09'::date, 30, 'approved', 'Performance confidence building'),
    ('st_matts', '2024-12-12'::date, 30, 'approved', 'Christmas carol on guitar'),
    ('st_art', '2024-12-16'::date, 45, 'approved', 'Holiday card making'),
    ('st_individual', '2024-12-19'::date, 30, 'approved', 'Year-end review session')
) AS v(st_name, session_date, duration, status, notes)
CROSS JOIN LATERAL (
    SELECT CASE st_name
        WHEN 'st_individual' THEN st_individual
        WHEN 'st_group' THEN st_group
        WHEN 'st_matts' THEN st_matts
        WHEN 'st_art' THEN st_art
        WHEN 'st_art_group' THEN st_art_group
    END as service_type_id
) st;

-- Add attendees to sessions (link clients to each session)
INSERT INTO session_attendees (session_id, client_id, individual_cost)
SELECT
    s.id,
    c.id,
    CASE
        WHEN st.category IN ('music_group', 'art_group') THEN
            ROUND((st.base_rate + st.per_person_rate * 2) / 3, 2)
        ELSE st.base_rate
    END
FROM sessions s
JOIN service_types st ON s.service_type_id = st.id
CROSS JOIN LATERAL (
    SELECT id FROM clients
    WHERE id NOT IN (SELECT client_id FROM session_attendees WHERE session_id = s.id)
    ORDER BY random()
    LIMIT CASE WHEN st.category IN ('music_group', 'art_group') THEN 3 ELSE 1 END
) c
WHERE NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = s.id);

-- Create invoices for all sessions with attendees
INSERT INTO invoices (session_id, client_id, amount, mca_cut, contractor_pay, status, payment_method, due_date, paid_date)
SELECT
    s.id,
    sa.client_id,
    sa.individual_cost,
    ROUND(sa.individual_cost * st.mca_percentage / 100, 2),
    LEAST(
        ROUND(sa.individual_cost * (100 - st.mca_percentage) / 100, 2),
        CASE WHEN st.contractor_cap > 0 THEN st.contractor_cap ELSE 999999 END
    ),
    CASE
        WHEN s.date < CURRENT_DATE - 45 THEN 'paid'::invoice_status
        WHEN s.date < CURRENT_DATE - 14 THEN 'sent'::invoice_status
        ELSE 'pending'::invoice_status
    END,
    cl.payment_method,
    s.date + 30,
    CASE WHEN s.date < CURRENT_DATE - 45 THEN s.date + 20 ELSE NULL END
FROM sessions s
JOIN session_attendees sa ON s.id = sa.session_id
JOIN service_types st ON s.service_type_id = st.id
JOIN clients cl ON sa.client_id = cl.id
WHERE s.status = 'approved'
AND NOT EXISTS (SELECT 1 FROM invoices WHERE session_id = s.id AND client_id = sa.client_id);

-- Show results
SELECT 'Created ' || COUNT(*) || ' sessions' as result FROM sessions
UNION ALL
SELECT 'Created ' || COUNT(*) || ' session attendees' FROM session_attendees
UNION ALL
SELECT 'Created ' || COUNT(*) || ' invoices' FROM invoices;
