-- Session 201: 2025-02-11 - Colleen - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-11', 30, service_type_uuid, contractor_uuid, 'approved', 'Clients home', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 202: 2025-02-18 - Colleen - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Clients home', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 203: 2025-02-25 - Colleen - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Clients home', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 204: 2025-02-10 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Clients home', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 205: 2025-02-20 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-20', 30, service_type_uuid, contractor_uuid, 'approved', 'Clients home', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 206: 2025-02-24 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Clients home', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 207: 2025-02-24 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Crosby Group H', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 208: 2025-02-10 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Crosby St Group', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 209: 2025-02-07 - Caroline - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'caroline@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-07', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 210: 2025-02-28 - Caroline West - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'caroline@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-28', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 211: 2025-02-14 - Caroline - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'caroline@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-14', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 212: 2025-02-21 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Main St DayHab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 213: 2025-02-20 - Bryan - Creative Remedies
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'bryan@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Creative Remedies (Art)' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-20', 30, service_type_uuid, contractor_uuid, 'approved', 'Matt’s Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 214: 2025-02-04 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-04', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 215: 2025-02-05 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 216: 2025-02-11 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-11', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 217: 2025-02-12 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 218: 2025-02-18 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 219: 2025-02-19 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-19', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 220: 2025-02-25 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 221: 2025-02-26 - Colleen - Musical Expressions
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 222: 2025-02-05 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior Dayhab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 223: 2025-02-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior dayhab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 224: 2025-02-19 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-19', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior DayHab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 225: 2025-02-26 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior DayHab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 226: 2025-02-03 - Colleen - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Virtual', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 227: 2025-02-10 - Colleen - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Virtual', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 228: 2025-02-24 - Colleen - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-02-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Virtual', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 229: 2025-03-27 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-27', 30, service_type_uuid, contractor_uuid, 'approved', 'Indian Church', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 230: 2025-03-17 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-17', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior DayHab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 231: 2025-03-10 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 232: 2025-03-03 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Amherst St', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 233: 2025-03-13 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-13', 30, service_type_uuid, contractor_uuid, 'approved', 'David St Group', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 234: 2025-03-06 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-06', 30, service_type_uuid, contractor_uuid, 'approved', 'David St Group', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 235: 2025-03-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 236: 2024-03-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2024-03-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 237: 2025-03-19 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-19', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior dayhab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 238: 2025-03-05 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior Dayhab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 239: 2025-03-26 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior dayhab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 240: 2025-03-31 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Senior Dayhab', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 241: 2025-03-24 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-03-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 242: 2025-04-07 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Amherst St grou', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 243: 2025-04-21 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Amherst st group', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 244: 2025-04-17 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 245: 2025-04-03 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-03', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 246: 2025-04-23 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-23', 30, service_type_uuid, contractor_uuid, 'approved', 'Broadway', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 247: 2025-04-10 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Broadway DayH', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 248: 2025-04-28 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Crosby St group', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 249: 2025-04-24 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Indian church', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 250: 2025-04-09 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 251: 2025-04-30 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 252: 2025-04-23 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-23', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 253: 2025-04-02 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 254: 2025-04-09 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 255: 2025-04-30 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 256: 2025-04-16 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-16', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 257: 2025-04-22 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-22', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 258: 2025-05-05 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-05', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 90 63
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%90 63%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 259: 2025-05-29 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-29', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 150 150 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%150 150 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 260: 2025-05-30 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-30', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 150 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%150 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 261: 2025-05-15 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-15', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 130 130 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%130 130 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 262: 2025-05-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-12', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 70 49 110 77 90 63 110 77
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%70 49 110 77 90 63 110 77%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 263: 2025-05-30 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-30', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 150 150 150 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%150 150 150 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 264: 2025-05-06 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-06', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 55 39.5 55 39.5 55 39.5
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%55 39.5 55 39.5 55 39.5%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 265: 2025-05-28 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 55 39.5
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%55 39.5%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 266: 2025-05-06 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-06', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 65 65 65 65 65 65 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%65 65 65 65 65 65 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 267: 2025-05-06 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-06', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 65 65 65 65 65 65 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%65 65 65 65 65 65 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 268: 2025-05-14 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 269: 2025-05-05 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-05', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *Prepaid *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*Prepaid *prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 270: 2025-05-28 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 271: 2025-05-07 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-07', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 272: 2025-05-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-12', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 273: 2025-05-01 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-05-01', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 150 150 150 0
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%150 150 150 0%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 274: 2025-06-02 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-02', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 90 63
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%90 63%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 275: 2025-06-16 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-16', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 90 63
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%90 63%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 276: 2025-06-20 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-20', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 277: 2025-06-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-12', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 150 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%150 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 278: 2025-06-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-12', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 70 49
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%70 49%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 279: 2025-06-23 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-23', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 90 63
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%90 63%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 280: 2025-06-20 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-20', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 70 49
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%70 49%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 281: 2025-06-26 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-26', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 150 150 0 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%150 150 0 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 282: 2025-04-17 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-04-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 283: 2025-06-18 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 55 39.5
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%55 39.5%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 284: 2025-06-30 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-30', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid *prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 285: 2025-06-30 - Colleen - Scholarship
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-30', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid *prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 286: 2025-06-18 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 287: 2025-06-11 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-11', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 288: 2025-06-25 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-25', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 289: 2025-06-23 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-23', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid *prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 290: 2025-06-30 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 291: 2025-06-12 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-12', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 292: 2025-06-16 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-16', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: *prepaid
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%*prepaid%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 293: 2025-06-26 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Lincoln CAPP', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 294: 2025-07-28 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-28', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 90 90 150 90 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%90 90 150 90 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 295: 2025-07-25 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 296: 2025-07-22 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-22', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 110 77 90 63
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%110 77 90 63%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 297: 2025-07-29 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 70 49 70 49
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%70 49 70 49%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 298: 2025-07-31 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 299: 2025-07-25 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 150 150 150 150
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%150 150 150 150%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 300: 2025-07-22 - Colleen - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'colleen@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-22', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Unknown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Unknown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;

