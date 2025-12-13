-- Session 301: 2025-07-17 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 302: 2025-07-15 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-15', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 303: 2025-07-09 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-09', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 304: 2025-07-31 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 0 25 0 50 55 38.5
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%0 25 0 50 55 38.5%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 305: 2025-07-28 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-28', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 306: 2025-07-17 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 307: 2025-08-28 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Broadway Cheek', org_id)
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


-- Session 308: 2025-08-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Main St', org_id)
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


-- Session 309: 2025-08-05 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Matts Music', org_id)
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


-- Session 310: 2025-08-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
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


-- Session 311: 2025-08-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Eggert Elementa', org_id)
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


-- Session 312: 2025-08-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Eggert Elementa', org_id)
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


-- Session 313: 2025-08-26 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'SASI Elma', org_id)
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


-- Session 314: 2025-08-04 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-04', 30, service_type_uuid, contractor_uuid, 'approved', 'Amherst St grou', org_id)
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


-- Session 315: 2025-08-06 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-06', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
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


-- Session 316: 2025-08-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 317: 2025-08-13 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 318: 2025-08-13 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 65 48
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%65 48%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 319: 2025-08-13 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 320: 2025-08-27 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-27', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 321: 2025-08-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 70 53 70 53 70 53 70 53 90 63
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%70 53 70 53 70 53 70 53 90 63%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 322: 2025-08-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-25', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 90 63 110 77
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%90 63 110 77%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 323: 2025-09-03 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-09-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
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


-- Session 324: 2025-09-04 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-09-04', 30, service_type_uuid, contractor_uuid, 'approved', 'Elmwood DayHa', org_id)
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


-- Session 325: 2025-09-08 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-09-08', 30, service_type_uuid, contractor_uuid, 'approved', 'Seniors', org_id)
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


-- Session 326: 2025-09-10 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-09-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Orchard Park Hig', org_id)
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


-- Session 327: 2025-09-11 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-09-11', 30, service_type_uuid, contractor_uuid, 'approved', 'Indian church', org_id)
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


-- Session 328: 2025-09-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-09-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Elma SASI', org_id)
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


-- Session 329: 2025-09-09 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-09-09', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
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


-- Session 330: 2025-10-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participate Eggert elementa  Colleen Group participate Eggert elementa  Colleen Group participate Eggert elementa  Colleen Group participate Eggert elementa  Colleen Courtney particip 4637 Miles', org_id)
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


-- Session 331: 2025-10-06 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-06', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participate Elma SASI Harold participat  Virtual Harold participat  Virtual', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Colleen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Colleen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Miley
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Miley%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Heisler
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Heisler%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 332: 2025-10-06 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-06', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participate Elma SASI Group participate The edge Tajwar requested Home Tajwar was worki Home Tajwar was watc  Home For the Hello So For the Hello So For the Hello So For the Hello So', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Colleen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Colleen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Caroline
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Caroline%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: West
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%West%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 333: 2025-07-07 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-07-07', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tajwar Tasheen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tajwar Tasheen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 334: 2025-06-18 - Colleen - Scholarship
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

    -- Attendee: Bentley
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bentley%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 335: 2025-06-18 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Faith
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Faith%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 336: 2025-06-18 - Jacob - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Eric
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Eric%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Lizzie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Lizzie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 337: 2025-06-18 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Jessica
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jessica%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 338: 2025-06-18 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Zack
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Zack%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 339: 2025-06-18 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Dan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Dan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 340: 2025-06-18 - Jacob - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Linda
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Linda%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Sylvia
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Sylvia%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 341: 2025-06-17 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 342: 2025-06-17 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Emily
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Emily%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Liz
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Liz%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Bryan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bryan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jea
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jea%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 343: 2025-06-17 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: DJ
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%DJ%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Bernie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bernie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 344: 2025-06-17 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Josiah
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Josiah%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 345: 2025-06-17 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Ikenna
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ikenna%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 346: 2025-06-17 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Davis
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Davis%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Piciulo classro
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Piciulo classro%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 347: 2025-06-17 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Wackenheim
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Wackenheim%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Starkey
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Starkey%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 348: 2025-06-17 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-17', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Rachel
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Rachel%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 349: 2025-06-20 - Colleen - Group Session
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

    -- Attendee: Bryan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bryan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Nick
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nick%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Hope
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hope%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Pam
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pam%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Th
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Th%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 350: 2025-06-20 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-20', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Ethan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ethan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 351: 2025-06-20 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-06-20', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Nicolas
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nicolas%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 352: 2025-06-20 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-20', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Lexi
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Lexi%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 353: 2025-06-27 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-27', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Jessica
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jessica%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 354: 2025-06-27 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-27', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 355: 2025-06-20 - Colleen - Group Session
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

    -- Attendee: Shannon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Shannon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Michelle
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Michelle%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Emily
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Emily%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 356: 2025-06-20 - Colleen - Group Session
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

    -- Attendee: Derek
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Derek%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Colleen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Colleen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Alon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Alon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 357: 2025-06-20 - Colleen - Group Session
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

    -- Attendee: Nan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Matthew
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Matthew%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Mark
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mark%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Thom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Thom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 358: 2025-06-20 - Colleen - Group Session
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

    -- Attendee: Patty Laurie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Patty Laurie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 359: 2025-06-27 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-27', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Zack
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Zack%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 360: 2025-06-27 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-27', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Dan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Dan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 361: 2025-06-24 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-24', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 362: 2025-06-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-06-24', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Francis
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Francis%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Pamela
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pamela%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Michael
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Michael%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 363: 2025-06-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-06-24', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jimmy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jimmy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Vernon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vernon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 364: 2025-06-24 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-24', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Josiah
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Josiah%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 365: 2025-06-24 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-24', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Ikenna
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ikenna%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 366: 2025-06-27 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-27', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Faith
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Faith%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 367: 2025-06-25 - Colleen - Group Session
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

    -- Attendee: Emily
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Emily%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Pam
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pam%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Fra
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Fra%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 368: 2025-06-25 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-06-25', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Nicolas
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nicolas%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 369: 2025-06-25 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-25', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Lexi
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Lexi%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 370: 2025-06-26 - Colleen - Group Session
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

    -- Attendee: Marshall
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Marshall%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Linda
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Linda%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Steve
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Steve%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Cra
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Cra%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 371: 2025-06-26 - Colleen - Group Session
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

    -- Attendee: Danielle
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Danielle%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Rashaan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Rashaan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Brandy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Brandy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 372: 2025-06-26 - Colleen - Group Session
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

    -- Attendee: Kayla
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kayla%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Kobe
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kobe%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Caleb
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Caleb%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Annie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Annie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 373: 2025-06-18 - Jacob - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 8 clients
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%8 clients%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 374: 2025-07-02 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-02', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Zack
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Zack%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 375: 2025-07-02 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-02', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Dan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Dan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 376: 2025-07-02 - Jacob - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-02', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Sylvia
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Sylvia%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Linda
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Linda%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 377: 2025-06-30 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-30', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 378: 2025-06-30 - Colleen - Group Session
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

    -- Attendee: Janet
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Janet%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 379: 2025-06-30 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-30', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Ikenna
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ikenna%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 380: 2025-06-30 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-06-30', 30, service_type_uuid, contractor_uuid, 'approved', '', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Josiah
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Josiah%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 381: 2025-06-18 - Jacob - Group Session
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', 'The group discussed their favorite things a', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Lizzie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Lizzie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Eric
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Eric%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Madisyn
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Madisyn%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 382: 2025-06-18 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-06-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Karen verbally responded whenever promp', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 383: 2025-07-16 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-16', 30, service_type_uuid, contractor_uuid, 'approved', 'Jessica sang along whenever prompted, a', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Jessica
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jessica%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 384: 2025-07-16 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-16', 30, service_type_uuid, contractor_uuid, 'approved', 'Karen laid in bed as the therapist sang son', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 385: 2025-07-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Anthony was still admitted at Buffalo Gene Group participated in the Hello Song, impr Josiah participated in the Hello Song, the I For the Hello Song, Tony sang hello 2 time During the Hello Song, Jim', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Nancy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nancy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Janet
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Janet%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Francis
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Francis%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Josiah
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Josiah%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jimmy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jimmy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Vernon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vernon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 386: 2025-07-14 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-07-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Anthony was still admitted at Buffalo Gene Group participated in the Hello Song, impr Josiah participated in the Hello Song, the I For the Hello Song, Tony sang hello 2 time During the Hello Song, Jim', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Nancy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nancy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Janet
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Janet%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Francis
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Francis%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Josiah
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Josiah%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tony%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jimmy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jimmy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Vernon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vernon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 387: 2025-07-14 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-07-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar was working with his SLP staff mem', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tajwar Tasheen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tajwar Tasheen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 388: 2025-07-15 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-15', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, xylop', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Simchick-Walkowski clas
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Simchick-Walkowski clas%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 389: 2025-07-15 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-15', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, xylop', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Reeves classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Reeves classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 390: 2025-07-15 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-15', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, xylop', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Busky classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Busky classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 391: 2025-07-28 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Faith and the therapist analyzed the forms', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Faith
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Faith%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 392: 2025-07-17 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Chmiel
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Chmiel%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Henn classro
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Henn classro%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 393: 2025-07-17 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Zuccari classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Zuccari classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 394: 2025-07-17 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Group participated in the Hello S', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Linda
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Linda%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Pamela
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pamela%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Liz
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Liz%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Br
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Br%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 395: 2025-07-28 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Jessica sang along with verbal prompting.', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Jessica
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jessica%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 396: 2025-07-28 - Jacob - In home music therapy
DO $$
DECLARE
  org_id uuid;
  contractor_uuid uuid;
  service_type_uuid uuid;
  session_uuid uuid;
  client_uuid uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;
  SELECT id INTO contractor_uuid FROM users WHERE email = 'jacob@maycreativearts.com' LIMIT 1;
  SELECT id INTO service_type_uuid FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id LIMIT 1;

  IF contractor_uuid IS NOT NULL AND service_type_uuid IS NOT NULL THEN
    INSERT INTO sessions (id, date, duration_minutes, service_type_id, contractor_id, status, notes, organization_id)
    VALUES (gen_random_uuid(), '2025-07-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Karen smiled when the therapist entered th', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 397: 2025-07-17 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, We''r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Christy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Christy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Marstel
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Marstel%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Kristophe
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kristophe%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 398: 2025-07-17 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, We''r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Derek
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Derek%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Elyse
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Elyse%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Kimberlyn
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kimberlyn%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 399: 2025-07-17 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-17', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, We''r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mitch
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mitch%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Noah
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Noah%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jeremy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jeremy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tiffan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tiffan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 400: 2025-07-21 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-21', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; group participated in the Hello S second half Josiah participated in the Hello Song, pian For the Hello Song, DJ sang hello 2 times During the Hello Song, John sang hello 2 ti For the Hell', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Bryan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bryan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Thatius
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Thatius%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Gret
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Gret%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Josiah
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Josiah%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: DJ
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%DJ%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Bernie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bernie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jesse
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jesse%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;

