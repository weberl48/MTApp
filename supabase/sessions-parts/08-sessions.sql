-- Session 701: 2025-12-02 - Colleen - Scholarship
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Jingl', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Henning
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Henning%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jones class
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jones class%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 702: 2025-12-02 - Colleen - Musical Expressions
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, Run', org_id)
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


-- Session 703: 2025-12-02 - Colleen - Scholarship
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Bentley continued to learn guitar and partic', org_id)
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


-- Session 704: 2025-12-02 - Colleen - Musical Expressions
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-02', 30, service_type_uuid, contractor_uuid, 'approved', 'Lexi participated in the Hello Song, Frosty', org_id)
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


-- Session 705: 2025-12-03 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Jingl', org_id)
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


-- Session 706: 2025-12-03 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Jingl', org_id)
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


-- Session 707: 2025-12-03 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Jingl', org_id)
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


-- Session 708: 2025-12-03 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-03', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, Jingl', org_id)
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


-- Session 709: 2025-12-05 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Dianne
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Dianne%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Eddie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Eddie%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Jav
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jav%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 710: 2025-12-05 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Michelle
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Michelle%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Chris
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Chris%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Elain
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Elain%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 711: 2025-12-05 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Mitch
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Mitch%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Chris
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Chris%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Tiffa
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tiffa%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 712: 2025-12-05 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-05', 30, service_type_uuid, contractor_uuid, 'approved', 'During the Hello Song, Laurie sang the ent', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Hillary Vicky patty Laurie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Hillary Vicky patty Laurie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 713: 2025-12-05 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Damon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Damon%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: David
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%David%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Will
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Will%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 714: 2025-12-05 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Kelly
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Kelly%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: JJ
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%JJ%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Jamie
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Jamie%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Sandy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Sandy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ro
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ro%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 715: 2025-12-05 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-05', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a Ch', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Sissy
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Sissy%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Elaine
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Elaine%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Roselyn
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Roselyn%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Ed
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Ed%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 716: 2025-12-08 - Caroline West - In home music therapy
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
    VALUES (gen_random_uuid(), '2025-12-08', 30, service_type_uuid, contractor_uuid, 'approved', 'Tajwar greeted the therapist verbally and to', org_id)
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


-- Session 717: 2025-12-09 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Synergy room (8 participants); Group parti', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Synergy room
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Synergy room%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 718: 2025-12-09 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Serenity room (9 participants); Group parti', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Serenity room
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Serenity room%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 719: 2025-12-09 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Harmony room (7 participants); Group part', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Harmony room
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Harmony room%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 720: 2025-12-09 - Colleen - Musical Expressions
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Therapist played Christmas music on the p', org_id)
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


-- Session 721: 2025-12-09 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, a dru', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Nick
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Nick%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Tom
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tom%' AND organization_id = org_id LIMIT 1;
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
  END IF;
END $$;


-- Session 722: 2025-12-09 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'First half; Tony participated in the Hello So First half; Michael participated in the Hello First half; Vernon participated in the Hello First half; Jimmy participated in the Hello S', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Tony
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Tony%' AND organization_id = org_id LIMIT 1;
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
    -- Attendee: Vernon
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Vernon%' AND organization_id = org_id LIMIT 1;
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


-- Session 723: 2025-12-09 - Colleen - Musical Expressions
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Ikenna participated in the Hello Song, Build', org_id)
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


-- Session 724: 2025-12-09 - Colleen - Musical Expressions
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Josiah participated in the Hello Song, Build', org_id)
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


-- Session 725: 2025-12-09 - Colleen - Scholarship
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, drum', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Henn
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Henn%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Webber classro
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Webber classro%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 726: 2025-12-09 - Colleen - Scholarship
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, drum', org_id)
    RETURNING id INTO session_uuid;

    -- Attendee: Starkey
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Starkey%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
    -- Attendee: Wackenheim
    SELECT id INTO client_uuid FROM clients WHERE name ILIKE '%Wackenheim%' AND organization_id = org_id LIMIT 1;
    IF client_uuid IS NOT NULL AND session_uuid IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM session_attendees WHERE session_id = session_uuid AND client_id = client_uuid) THEN
        INSERT INTO session_attendees (id, session_id, client_id, individual_cost)
        VALUES (gen_random_uuid(), session_uuid, client_uuid, 50);
      END IF;
    END IF;
  END IF;
END $$;


-- Session 727: 2025-12-09 - Colleen - Musical Expressions
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-09', 30, service_type_uuid, contractor_uuid, 'approved', 'Rachel participated in the Hello Song, Buil', org_id)
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


-- Session 728: 2025-12-10 - Colleen - Scholarship
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Nicolas participated in the Hello Song, Buil', org_id)
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


-- Session 729: 2025-12-10 - Colleen - Musical Expressions
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Lexi participated in the Hello Song, Build a', org_id)
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


-- Session 730: 2025-12-10 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, He''ll', org_id)
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


-- Session 731: 2025-12-10 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, He''ll', org_id)
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


-- Session 732: 2025-12-10 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, He''ll', org_id)
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


-- Session 733: 2025-12-10 - Colleen - Group Session
DO $$
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
    VALUES (gen_random_uuid(), '2025-12-10', 30, service_type_uuid, contractor_uuid, 'approved', 'Group participated in the Hello Song, He''ll', org_id)
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

-- Verify the data
SELECT 'Sessions' as table_name, COUNT(*) as count FROM sessions WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Session Attendees', COUNT(*) FROM session_attendees sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE s.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');
