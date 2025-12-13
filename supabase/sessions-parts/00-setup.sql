-- Historical Sessions Import
-- Generated from Excel data

-- Clean up any existing sessions from previous import attempts
DO $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;

  -- Delete existing session_attendees and sessions
  DELETE FROM session_attendees WHERE session_id IN (SELECT id FROM sessions WHERE organization_id = org_id);
  DELETE FROM sessions WHERE organization_id = org_id;

  RAISE NOTICE 'Cleared existing sessions for org: %', org_id;
END $$;

-- First, ensure service types exist
DO $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;

  -- Insert service types if they don't exist (check by name)
  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'In-Home Individual Music Therapy' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'In-Home Individual Music Therapy', 'music_individual', 'in_home', 50, 0, 23, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'In-Home Group Music Therapy' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'In-Home Group Music Therapy', 'music_group', 'in_home', 50, 20, 30, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Matt''s Music Individual' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Matt''s Music Individual', 'music_individual', 'matts_music', 55, 0, 30, 10, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Musical Expressions' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Musical Expressions', 'music_individual', 'other', 50, 0, 23, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Creative Remedies (Art)' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Creative Remedies (Art)', 'art_individual', 'other', 40, 0, 20, 0, org_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM service_types WHERE name = 'Scholarship Session' AND organization_id = org_id) THEN
    INSERT INTO service_types (id, name, category, location, base_rate, per_person_rate, mca_percentage, rent_percentage, organization_id)
    VALUES (gen_random_uuid(), 'Scholarship Session', 'music_individual', 'in_home', 50, 0, 0, 0, org_id);
  END IF;
END $$;

-- Insert sessions

