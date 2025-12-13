-- Session 601: 2025-10-23 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-23', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, 10 Tr', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hackett classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hackett classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 602: 2025-10-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Eric
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Eric%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tommy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tommy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Robbie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Robbie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Kelly
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kelly%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 603: 2025-10-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Reggie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Reggie%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Jason
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jason%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Mik
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mik%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 604: 2025-10-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-24', 30, service_type_uuid, contractor_uuid, 'approved', 'During the Hello Song, Laurie sang hello 2', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hillary
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hillary%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Vicky
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vicky%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Laurie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Laurie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 605: 2025-10-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Harmony classroom; 7 in
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Harmony classroom; 7 in%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 606: 2025-10-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Synergy classroom; 7 ind
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Synergy classroom; 7 ind%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 607: 2025-10-24 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song with r', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Serenity classroom; 6 ind
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Serenity classroom; 6 ind%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 608: 2025-10-25 - Bryan - Creative Remedies
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
    VALUES (gen_random_uuid(), '2025-10-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Part1- Met with client and reviewed positiv', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Bryan Palmer
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bryan Palmer%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 609: 2025-10-28 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-10-28', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar was watching tv when the therapist', org_id)
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


-- Session 610: 2025-10-29 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Anthony was awake for the entire session', org_id)
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


-- Session 611: 2025-10-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; group participated in the Hello S', org_id)
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
    -- Attendee: Thatius
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Thatius%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 612: 2025-10-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, Steven sang the entire', org_id)
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
    -- Attendee: Mich
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mich%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 613: 2025-10-29 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Henn classroom; Group participated in the', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Henn classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Henn classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 614: 2025-10-29 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Piciulo classroom; Group participated in th', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Piciulo classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Piciulo classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 615: 2025-10-29 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Nicolas Participated in the Hello Song, the', org_id)
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


-- Session 616: 2025-10-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Tippi', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Grossman classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Grossman classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 617: 2025-10-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Tippi', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Funigiello classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Funigiello classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 618: 2025-10-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Tippi', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Couell classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Couell classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 619: 2025-10-29 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-29', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Tippi', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hackett classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hackett classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 620: 2025-10-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ha', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mark
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mark%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Kayla
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kayla%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Owen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Owen%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 621: 2025-10-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ha', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Jackie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jackie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Steven
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Steven%' AND organization_id = org_id LIMIT 1;
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


-- Session 622: 2025-10-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ha', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Dennis
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Dennis%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ivan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ivan%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 623: 2025-10-31 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-10-31', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ha', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Marshall
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Marshall%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Katie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Katie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Craig
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Craig%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
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


-- Session 624: 2025-11-03 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Dan smiled while the therapist played song', org_id)
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


-- Session 625: 2025-11-03 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Devon played the verse of "Let it Be" on pi', org_id)
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


-- Session 626: 2025-11-03 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Zack played the first line of the melody of "', org_id)
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


-- Session 627: 2025-11-03 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'The clients wrote and sang a song togethe', org_id)
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


-- Session 628: 2025-11-03 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Jessica gave one, two, and three syllable r', org_id)
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


-- Session 629: 2025-11-03 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Karen smiled and laughed while the therap', org_id)
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


-- Session 630: 2025-11-03 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Faith wrote two verses for her new song ab', org_id)
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


-- Session 631: 2025-11-03 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'The clients listened to and analyzed the lyr', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: approx 12
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%approx 12%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 632: 2025-11-03 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Didn''t do the session - lice outbreak - not n', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: N/A
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%N/A%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 633: 2025-11-03 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar chose an instrument after he was gi Anthony remained awake for the entire ses Group participated in the Hello Song, stret For the Hello Song, DJ hummed the entire During the Hello Song, John sa', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tajwar
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tajwar%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tasheen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tasheen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Kare
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kare%' AND organization_id = org_id LIMIT 1;
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


-- Session 634: 2025-11-03 - Colleen - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar chose an instrument after he was gi Anthony remained awake for the entire ses Group participated in the Hello Song, stret For the Hello Song, DJ hummed the entire During the Hello Song, John sa', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tajwar
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tajwar%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tasheen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tasheen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Kare
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kare%' AND organization_id = org_id LIMIT 1;
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


-- Session 635: 2025-11-03 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar chose an instrument after he was gi Anthony remained awake for the entire ses Group participated in the Hello Song, stret For the Hello Song, DJ hummed the entire During the Hello Song, John sa', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tajwar
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tajwar%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tasheen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tasheen%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Anthony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Anthony%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Kare
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kare%' AND organization_id = org_id LIMIT 1;
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


-- Session 636: 2025-11-04 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-04', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Harmony classroom; 6 in
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Harmony classroom; 6 in%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 637: 2025-11-04 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-04', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Synergy classroom; 8 ind
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Synergy classroom; 8 ind%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 638: 2025-11-04 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-04', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Serenity room; 8 individua
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Serenity room; 8 individua%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 639: 2025-11-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Drum', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Grossman classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Grossman classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 640: 2025-11-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Drum', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Funigiello classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Funigiello classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 641: 2025-11-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Drum', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Couell classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Couell classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 642: 2025-11-05 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Drum', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hackett classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hackett classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 643: 2025-11-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Javier
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Javier%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Brenda
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Brenda%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Andrew
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Andrew%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ne
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ne%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 644: 2025-11-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Kayla
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kayla%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Clay
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Clay%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Keller
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Keller%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Christia
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Christia%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 645: 2025-11-07 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-07', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Matt
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Matt%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Tabitha
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tabitha%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Genesis
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Genesis%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ma
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ma%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 646: 2025-11-10 - Bryan - Creative Remedies
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
    VALUES (gen_random_uuid(), '2025-11-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Part1-Met with client and reviewed highs a', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Bryan Palmer
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bryan Palmer%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 647: 2025-11-11 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-11', 30, service_type_uuid, contractor_uuid, 'approved', 'Sang goodbye during Nordoff Robbins “He', org_id)
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


-- Session 648: 2025-11-12 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', '"Therapist played on the guitar and sang fo', org_id)
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


-- Session 649: 2025-11-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Wi', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Liz
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Liz%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Tom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jeanie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jeanie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Kar
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kar%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 650: 2025-11-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, Tony sang the entire s During the Hello Song, Vernon waved hello During the Hello Song, Jimmy sang hello 1 For the Hello Song, Michael sang hello 1 ti', org_id)
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
    -- Attendee: Michael
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Michael%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 651: 2025-11-12 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Ikenna participated in the Hello S', org_id)
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


-- Session 652: 2025-11-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Grossman classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Grossman classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 653: 2025-11-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Funigiello
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Funigiello%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 654: 2025-11-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Couell classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Couell classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 655: 2025-11-12 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-12', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hackett classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hackett classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 656: 2025-11-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ho', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Rashaan
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Rashaan%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Camia
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Camia%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 657: 2025-11-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ho', org_id)
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


-- Session 658: 2025-11-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-14', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ho', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mo
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mo%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Sean
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Sean%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 659: 2025-11-14 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-14', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, Hillary sang the entire During the Hello Song, Vicky sang the enti For the Hello Song, Patty sang hello 2 time During the Hello Song, Laurie sang hello 2', org_id)
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
    -- Attendee: Laurie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Laurie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 660: 2025-11-18 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', '“Hello/Goodbye”- Beatles, fast/slow yes/no', org_id)
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


-- Session 661: 2025-11-18 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Therapist provided live music on the guitar', org_id)
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


-- Session 662: 2025-11-18 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Th', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Danny
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Danny%' AND organization_id = org_id LIMIT 1;
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


-- Session 663: 2025-11-18 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, DJ hummed the entire During the Hello Song, John sang hello 2 ti For the Hello Song, Bernie sang time to sa During the Hello Song, Jesse sat down ne', org_id)
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


-- Session 664: 2025-11-18 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Ikenna participated in the Hello Song, the', org_id)
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


-- Session 665: 2025-11-18 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Josiah participated in the Hello Song, ABC', org_id)
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


-- Session 666: 2025-11-18 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Hamm classroom; Group participated in th', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hamm classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hamm classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 667: 2025-11-18 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Henning classroom; Group participated in t', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Henning classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Henning classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 668: 2025-11-18 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, Hun', org_id)
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


-- Session 669: 2025-11-18 - Colleen - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-18', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Hailey continued to work on her second half Harold participated in a music therapy ses', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hailey
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hailey%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Harold
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Harold%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: McCown
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%McCown%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 670: 2025-11-21 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, the H', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mark
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mark%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Kayla
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kayla%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Owen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Owen%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 671: 2025-11-21 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, the H', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Jackie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jackie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Steven
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Steven%' AND organization_id = org_id LIMIT 1;
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


-- Session 672: 2025-11-21 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, the H', org_id)
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
    -- Attendee: Stephanie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Stephanie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 673: 2025-11-21 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-21', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, the H', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Marshal
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Marshal%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Katie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Katie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Afif
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Afif%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Carme
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Carme%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 674: 2025-11-24 - Bryan - Creative Remedies
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
    VALUES (gen_random_uuid(), '2025-11-24', 30, service_type_uuid, contractor_uuid, 'approved', 'Part1-Met with client and reviewed previou', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Bryan Palmer
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Bryan Palmer%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 675: 2025-11-25 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Therapist provided live guitar music for 30', org_id)
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


-- Session 676: 2025-11-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Th', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Gretchen
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Gretchen%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Tom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Brya
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Brya%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 677: 2025-11-25 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, Tony sang the entire s During the Hello Song, Vernon played his j For the Hello Song, Michael sang the entir During the Hello Song, Jimmy said hello 1', org_id)
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
    -- Attendee: Michael
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Michael%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 678: 2025-11-25 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Ikenna participated in the Hello Song, Tipit', org_id)
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


-- Session 679: 2025-11-25 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Josiah participated in the Hello Song, Hun', org_id)
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


-- Session 680: 2025-11-25 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hamm classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hamm classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 681: 2025-11-25 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Shak', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Piciulo classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Piciulo classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 682: 2025-11-25 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, the', org_id)
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


-- Session 683: 2025-11-25 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-11-25', 30, service_type_uuid, contractor_uuid, 'approved', 'Lexi participated in the Hello Song, Tipity T', org_id)
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


-- Session 684: 2025-11-30 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Zach worked on reading the music for “Ge', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Zach
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Zach%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 685: 2025-11-30 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Dan listened to the therapist sing songs.  H', org_id)
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


-- Session 686: 2025-11-30 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Jessica gave verbal responses when prom', org_id)
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


-- Session 687: 2025-11-30 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Karen verbally responded whenever promp', org_id)
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


-- Session 688: 2025-11-30 - Jacob - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'Faith laid out the structure for her lyrics for', org_id)
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


-- Session 689: 2025-11-30 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'The group discussed the history of the blue', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Approx 8-10 clients
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Approx 8-10 clients%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 690: 2025-11-30 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'The group discussed and wrote a song ab', org_id)
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


-- Session 691: 2025-11-30 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-11-30', 30, service_type_uuid, contractor_uuid, 'approved', 'The group listened to and discussed three', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 6-8 participants
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%6-8 participants%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 692: 2025-12-01 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-12-01', 30, service_type_uuid, contractor_uuid, 'approved', 'The group listened to different versions of t', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: 10-12 participants
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%10-12 participants%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 693: 2025-12-01 - Jacob - Group Session
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
    VALUES (gen_random_uuid(), '2025-12-01', 30, service_type_uuid, contractor_uuid, 'approved', 'The group discussed and wrote a song ab', org_id)
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


-- Session 694: 2025-12-01 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-12-01', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar answered the door when the therap', org_id)
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


-- Session 695: 2025-12-02 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Therapist played holiday songs on the guit', org_id)
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


-- Session 696: 2025-12-02 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ho', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: John
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%John%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Liz
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Liz%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Thomas
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Thomas%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 697: 2025-12-02 - Colleen - Group Session
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'For the Hello Song, DJ said hello while pla During the Hello Song, John said hello whi For the Hello Song, Bernie said time to say During the Hello Song, Jesse made eye co', org_id)
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


-- Session 698: 2025-12-02 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Ikenna participated in the Hello Song, Old', org_id)
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


-- Session 699: 2025-12-02 - Colleen - Musical Expressions
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Josiah participated in the Hello Song, Jingl', org_id)
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


-- Session 700: 2025-12-02 - Colleen - Scholarship
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Piciulo classroom; Group participated in th', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Piciulo classroom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Piciulo classroom%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;

