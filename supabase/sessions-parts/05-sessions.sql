-- Session 401: 2025-07-21 - Colleen - Musical Expressions
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


-- Session 402: 2025-07-21 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-07-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar was working with his ALP staff mem', org_id)
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


-- Session 403: 2025-07-22 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-22', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, 10 Li', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Simchick - Walkowski cla
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Simchick - Walkowski cla%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 404: 2025-07-22 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-22', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Wate', org_id)
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


-- Session 405: 2025-07-22 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-22', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Wate', org_id)
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


-- Session 406: 2025-07-22 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-07-22', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, Bea', org_id)
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


-- Session 407: 2025-07-25 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Bentley improvised on the piano for 15 min', org_id)
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


-- Session 408: 2025-07-25 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Guarnieri
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Guarnieri%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Piciulo clas
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Piciulo clas%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 409: 2025-07-25 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Fowler
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Fowler%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Zuccari classr
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Zuccari classr%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 410: 2025-07-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Group participated in the Hello S', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Pamela
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pamela%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 411: 2025-07-25 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'NO SHOW; Therapist waited until 4:15pm', org_id)
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


-- Session 412: 2025-07-25 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Lexi participated in the Hello Song, Bear W', org_id)
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


-- Session 413: 2025-07-28 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-07-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Devon played the chords of the verse of "L', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Devon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Devon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 414: 2025-07-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Su', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mark
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mark%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Damon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Damon%' AND organization_id = org_id LIMIT 1;
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


-- Session 415: 2025-07-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Su', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: JJ
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%JJ%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Bobby
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bobby%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ron
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ron%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tayeeba
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tayeeba%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 416: 2025-07-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Su', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Sissy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Sissy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Donna
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Donna%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Shontell
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Shontell%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ros
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ros%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 417: 2025-07-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Hillary sang the entire Hello Song while pla For the Hello Song, Patty sang hello 2 time', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hillary Patty
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hillary Patty%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 418: 2025-07-29 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Therapist provided live music for the 30 mi', org_id)
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


-- Session 419: 2025-07-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, an e', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Gretchen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Gretchen%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Brian
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Brian%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 420: 2025-07-29 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Josiah participated in the Hello Song, the S', org_id)
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


-- Session 421: 2025-07-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', 'During the Hello Song, Vernon waved hello', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tony Vernon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tony Vernon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 422: 2025-07-28 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-07-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar was working with his ALP staff mem', org_id)
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


-- Session 423: 2025-07-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Build', org_id)
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


-- Session 424: 2025-07-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Build', org_id)
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


-- Session 425: 2025-07-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Build', org_id)
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


-- Session 426: 2025-07-31 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Old', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Guinieri
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Guinieri%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Piciulo class
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Piciulo class%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 427: 2025-07-31 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Build', org_id)
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


-- Session 428: 2025-07-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; group participated in the Hello S', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Pamela
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pamela%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: James
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%James%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 429: 2025-07-31 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Nicolas participated in the Hello Song, Kitc', org_id)
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


-- Session 430: 2025-07-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Megan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Megan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Paul
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Paul%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Brian
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Brian%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 431: 2025-07-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Vinny
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vinny%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Reggie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Reggie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jason
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jason%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tim
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tim%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 432: 2025-07-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a sha For the Hello Song, DJ sang hello 2 times During the Hello Song, John sang hello 2 ti For the Hello Song, Bernie sang time to sa Group participated in the H', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Colleen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Colleen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 433: 2025-07-07 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-07-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a sha For the Hello Song, DJ sang hello 2 times During the Hello Song, John sang hello 2 ti For the Hello Song, Bernie sang time to sa Group participated in the H', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Colleen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Colleen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 434: 2025-07-08 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-08', 30, service_type_uuid, contractor_uuid, 'approved', 'Bentley improvised on the guitar for 15 min', org_id)
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


-- Session 435: 2025-07-09 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, If Yo', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Piciulo
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Piciulo%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Davis classro
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Davis classro%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 436: 2025-07-09 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-07-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Wackenheim and Starkey classrooms; Gro', org_id)
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


-- Session 437: 2025-07-09 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a tra', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Thatius
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Thatius%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Nancy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nancy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jean
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jean%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 438: 2025-07-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, Patty sang hello 2 time', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hillary
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hillary%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Vicky
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vicky%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Patty
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Patty%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 439: 2025-07-31 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Zack identified notes on a treble clef staff a', org_id)
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


-- Session 440: 2025-07-31 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'The group wrote a song about activities to', org_id)
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


-- Session 441: 2025-07-31 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-07-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Devon successfully and independently pla', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Devon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Devon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 442: 2025-08-04 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-08-04', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar sat on his couch and verbally greet', org_id)
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


-- Session 443: 2025-08-05 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Therapist provided live music on guitar for', org_id)
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


-- Session 444: 2025-08-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a dis', org_id)
    RETURNING id INTO session_uuid;

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
    -- Attendee: Liz
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Liz%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Lin
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Lin%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 445: 2025-08-05 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Ikenna participated in the Hello S', org_id)
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


-- Session 446: 2025-08-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, DJ sang hello 2 times During the Hello Song, John sang hello 2 ti For the Hello Song, Bernie sang hello 2 tim During the Hello Song, Jesse made eye co', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Dj
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Dj%' AND organization_id = org_id LIMIT 1;
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


-- Session 447: 2025-08-05 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Josiah participated in the Hello Song, Appl', org_id)
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


-- Session 448: 2025-08-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Appl', org_id)
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


-- Session 449: 2025-08-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Appl', org_id)
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


-- Session 450: 2025-08-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Appl', org_id)
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


-- Session 451: 2025-08-05 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, Hun', org_id)
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


-- Session 452: 2025-08-07 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Bentley participated in the Hello Song, con', org_id)
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


-- Session 453: 2025-08-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Group participated in the Hello S', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Janet
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Janet%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Liz
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Liz%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 454: 2025-08-07 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Ethan and therapist listened to The Bonnie', org_id)
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


-- Session 455: 2025-08-07 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Lexi participated in the Hello Song, Kitchen', org_id)
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


-- Session 456: 2025-08-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, xylop', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Lucy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Lucy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Keith
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Keith%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jennifer
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jennifer%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Sama
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Sama%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 457: 2025-08-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', '"Group participated in the Hello Song, lyric', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Jenn
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jenn%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Derek
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Derek%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Victoria
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Victoria%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Meg
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Meg%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 458: 2025-08-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a 20', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Nan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tabetha
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tabetha%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Mitch
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mitch%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Genes
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Genes%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 459: 2025-08-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-07', 30, service_type_uuid, contractor_uuid, 'approved', 'During the Hello Song, Hillary sang the ent', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Vicky
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vicky%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Patty
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Patty%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Brittany
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Brittany%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Hillar
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hillar%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 460: 2025-08-11 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-08-11', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar greeted the therapist verbally, laid o', org_id)
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


-- Session 461: 2025-08-13 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, 10 Li', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Simchick - Walkowski cla
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Simchick - Walkowski cla%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 462: 2025-08-13 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, 10 Li', org_id)
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


-- Session 463: 2025-08-13 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, 10 Li', org_id)
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


-- Session 464: 2025-08-13 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'Maynard classroom; Group participated in', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Maynard classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Maynard classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 465: 2025-08-13 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'Zacari classroom; Group participated in the', org_id)
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


-- Session 466: 2025-08-13 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Group participated in the Hello S', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Liz
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Liz%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Gretchen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Gretchen%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Pam
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pam%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 467: 2025-08-13 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'Nicolas participated in the Hello Song, the', org_id)
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


-- Session 468: 2025-08-13 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-13', 30, service_type_uuid, contractor_uuid, 'approved', 'Lexi participated in the Hello Song, When I', org_id)
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


-- Session 469: 2025-08-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with e', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mark
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mark%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Damon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Damon%' AND organization_id = org_id LIMIT 1;
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


-- Session 470: 2025-08-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with e', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Anna
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anna%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ron
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ron%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Bobby
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bobby%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Curtis
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Curtis%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 471: 2025-08-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with e', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: No
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%No%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Amanda
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Amanda%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tim
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tim%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Edwardo
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Edwardo%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 472: 2025-08-21 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-08-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Zack played the melody to Pink Pony Club', org_id)
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


-- Session 473: 2025-08-21 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-08-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Dan smiled and shook the therapists hand', org_id)
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


-- Session 474: 2025-08-21 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-21', 30, service_type_uuid, contractor_uuid, 'approved', 'The group wrote a song about what duties', org_id)
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


-- Session 475: 2025-08-21 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-08-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Faith began choosing chords for each sect', org_id)
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


-- Session 476: 2025-08-21 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-08-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Jessica gave a three syllable response wh', org_id)
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


-- Session 477: 2025-08-21 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-08-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Karen verbally responded to all prompts.  S', org_id)
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


-- Session 478: 2025-08-26 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Therapist provided live music on the guitar', org_id)
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


-- Session 479: 2025-08-26 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a rai', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Bryan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bryan%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Lin
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Lin%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 480: 2025-08-26 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Ikenna participated in the Hello S', org_id)
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


-- Session 481: 2025-08-26 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, Tony sang the entire s During the Hello Song, he waved hello whi For the Hello Song, Jimmy sang hello 2 tim', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tony%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Jimmy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jimmy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 482: 2025-08-26 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Josiah participated in the Hello Song on hi', org_id)
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


-- Session 483: 2025-08-26 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Classroom 1; Group participated in the Hel', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Classroom 1
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Classroom 1%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 484: 2025-08-26 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Classroom 2; Group participated in the Hel', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Classroom 2
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Classroom 2%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 485: 2025-08-26 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Classroom 3; Group participated in the Hel', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Classroom 3
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Classroom 3%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 486: 2025-08-26 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-26', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, the', org_id)
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


-- Session 487: 2025-08-28 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-28', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Group participated in the Hello S', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Pamela
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Pamela%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Jo
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jo%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 488: 2025-08-28 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-08-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Lexi participated in the Hello Song, Lets G', org_id)
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


-- Session 489: 2025-08-28 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, sing', org_id)
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


-- Session 490: 2025-08-28 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Tra', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Kenneth
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kenneth%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Mike
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mike%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jim
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jim%' AND organization_id = org_id LIMIT 1;
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


-- Session 491: 2025-08-28 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Tra', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mary
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mary%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Beth
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Beth%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Jordan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jordan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: De
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%De%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 492: 2025-08-28 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-08-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Tra', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Afif
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Afif%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jean
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jean%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Chuck
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Chuck%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ch
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ch%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 493: 2025-09-02 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Zack played Ode to joy independently on t', org_id)
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


-- Session 494: 2025-09-02 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Dan participated in the hello song, by shak', org_id)
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


-- Session 495: 2025-09-02 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Faith finished the song structure for her ori', org_id)
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


-- Session 496: 2025-09-02 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Jessica consistently gave 3 syllable respon', org_id)
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


-- Session 497: 2025-09-02 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Karen verbally responded whenever music', org_id)
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


-- Session 498: 2025-09-02 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'The group wrote a song about their dream', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Karen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Karen%' AND organization_id = org_id LIMIT 1;
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


-- Session 499: 2025-09-02 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, the', org_id)
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


-- Session 500: 2025-09-02 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-09-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Client no showed; Grandma will pay cance', org_id)
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

