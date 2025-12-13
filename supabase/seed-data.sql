-- Database Seed Script for May Creative Arts
-- Generated from Excel data
-- Run this in Supabase SQL Editor

-- First, get the organization ID (assuming single org setup)
DO $$
DECLARE
  org_id uuid;
  owner_id uuid;
BEGIN
  -- Get or create the organization
  SELECT id INTO org_id FROM organizations WHERE slug = 'may-creative-arts' LIMIT 1;

  IF org_id IS NULL THEN
    INSERT INTO organizations (name, slug, settings)
    VALUES ('May Creative Arts', 'may-creative-arts', '{}')
    RETURNING id INTO org_id;
  END IF;

  -- Get the owner user (first admin/owner in the org)
  SELECT id INTO owner_id FROM users
  WHERE organization_id = org_id AND role IN ('owner', 'developer')
  LIMIT 1;

  -- Delete existing data (in correct order due to foreign keys)
  DELETE FROM session_attendees WHERE session_id IN (SELECT id FROM sessions WHERE organization_id = org_id);
  DELETE FROM invoices WHERE organization_id = org_id;
  DELETE FROM sessions WHERE organization_id = org_id;
  DELETE FROM clients WHERE organization_id = org_id;
  -- Don't delete users - we'll update existing contractors or create new ones

  RAISE NOTICE 'Cleared existing data for org: %', org_id;

END $$;

-- Insert/Update Contractors

-- Contractor: Colleen O'Brien
INSERT INTO users (id, email, name, role, organization_id)
SELECT
  gen_random_uuid(),
  'colleen@maycreativearts.com',
  'Colleen O''Brien',
  'contractor',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'colleen@maycreativearts.com'
);

-- Contractor: Jacob Weber
INSERT INTO users (id, email, name, role, organization_id)
SELECT
  gen_random_uuid(),
  'jacob@maycreativearts.com',
  'Jacob Weber',
  'contractor',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'jacob@maycreativearts.com'
);

-- Contractor: Bryan Palmer
INSERT INTO users (id, email, name, role, organization_id)
SELECT
  gen_random_uuid(),
  'bryan@maycreativearts.com',
  'Bryan Palmer',
  'contractor',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'bryan@maycreativearts.com'
);

-- Contractor: Caroline West
INSERT INTO users (id, email, name, role, organization_id)
SELECT
  gen_random_uuid(),
  'caroline@maycreativearts.com',
  'Caroline West',
  'contractor',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'caroline@maycreativearts.com'
);

-- Contractor: Amara Johnson
INSERT INTO users (id, email, name, role, organization_id)
SELECT
  gen_random_uuid(),
  'amara@maycreativearts.com',
  'Amara Johnson',
  'contractor',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'amara@maycreativearts.com'
);


-- Insert Clients

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Aden Finkas',
  'client1@example.com',
  '716-555-1000',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Angie',
  'client2@example.com',
  '716-555-1001',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Annie',
  'client3@example.com',
  '716-555-1002',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Anthony',
  'client4@example.com',
  '716-555-1003',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Arnold Cook',
  'client5@example.com',
  '716-555-1004',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Austin',
  'client6@example.com',
  '716-555-1005',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Ayub',
  'client7@example.com',
  '716-555-1006',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Bentley',
  'client8@example.com',
  '716-555-1007',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Bernie',
  'client9@example.com',
  '716-555-1008',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Brendan O''Connell',
  'client10@example.com',
  '716-555-1009',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Brittany',
  'client11@example.com',
  '716-555-1010',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Bryan Palmer',
  'client12@example.com',
  '716-555-1011',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Bryce',
  'client13@example.com',
  '716-555-1012',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Caleb',
  'client14@example.com',
  '716-555-1013',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Cindy',
  'client15@example.com',
  '716-555-1014',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Claire Syracuse',
  'client16@example.com',
  '716-555-1015',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Courtney Jordan',
  'client17@example.com',
  '716-555-1016',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'DJ',
  'client18@example.com',
  '716-555-1017',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Dan',
  'client19@example.com',
  '716-555-1018',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'David Harrington',
  'client20@example.com',
  '716-555-1019',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Derek',
  'client21@example.com',
  '716-555-1020',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Devon',
  'client22@example.com',
  '716-555-1021',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Devyn',
  'client23@example.com',
  '716-555-1022',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Elijah Siever',
  'client24@example.com',
  '716-555-1023',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Emily',
  'client25@example.com',
  '716-555-1024',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Emma',
  'client26@example.com',
  '716-555-1025',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Eric',
  'client27@example.com',
  '716-555-1026',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Ethan',
  'client28@example.com',
  '716-555-1027',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Faith',
  'client29@example.com',
  '716-555-1028',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Francis',
  'client30@example.com',
  '716-555-1029',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Gianna',
  'client31@example.com',
  '716-555-1030',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Gretchen',
  'client32@example.com',
  '716-555-1031',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Harold McCown',
  'client33@example.com',
  '716-555-1032',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Hillary',
  'client34@example.com',
  '716-555-1033',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Hope',
  'client35@example.com',
  '716-555-1034',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Ikenna',
  'client36@example.com',
  '716-555-1035',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'James',
  'client37@example.com',
  '716-555-1036',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Janet',
  'client38@example.com',
  '716-555-1037',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Jeanie',
  'client39@example.com',
  '716-555-1038',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Jessica',
  'client40@example.com',
  '716-555-1039',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Jimmy',
  'client41@example.com',
  '716-555-1040',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'John',
  'client42@example.com',
  '716-555-1041',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Jordan',
  'client43@example.com',
  '716-555-1042',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Joseph',
  'client44@example.com',
  '716-555-1043',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Josiah',
  'client45@example.com',
  '716-555-1044',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Julie',
  'client46@example.com',
  '716-555-1045',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Karen',
  'client47@example.com',
  '716-555-1046',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Kayla',
  'client48@example.com',
  '716-555-1047',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Kobe',
  'client49@example.com',
  '716-555-1048',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Kristin',
  'client50@example.com',
  '716-555-1049',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Laurie',
  'client51@example.com',
  '716-555-1050',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Lexi',
  'client52@example.com',
  '716-555-1051',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Lincoln',
  'client53@example.com',
  '716-555-1052',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Linda',
  'client54@example.com',
  '716-555-1053',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Liz',
  'client55@example.com',
  '716-555-1054',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Lizzie',
  'client56@example.com',
  '716-555-1055',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Lizziey Hauser',
  'client57@example.com',
  '716-555-1056',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Madisyn',
  'client58@example.com',
  '716-555-1057',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Maeve Hathaway',
  'client59@example.com',
  '716-555-1058',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Mark',
  'client60@example.com',
  '716-555-1059',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Matt',
  'client61@example.com',
  '716-555-1060',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Michael',
  'client62@example.com',
  '716-555-1061',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Michelle',
  'client63@example.com',
  '716-555-1062',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Mikey',
  'client64@example.com',
  '716-555-1063',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Molly Hathaway',
  'client65@example.com',
  '716-555-1064',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Nancy',
  'client66@example.com',
  '716-555-1065',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Nick',
  'client67@example.com',
  '716-555-1066',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Nicolas',
  'client68@example.com',
  '716-555-1067',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Olivia',
  'client69@example.com',
  '716-555-1068',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Owen',
  'client70@example.com',
  '716-555-1069',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Pam',
  'client71@example.com',
  '716-555-1070',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Patty',
  'client72@example.com',
  '716-555-1071',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Rachel',
  'client73@example.com',
  '716-555-1072',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Sandy Baker',
  'client74@example.com',
  '716-555-1073',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Shannon',
  'client75@example.com',
  '716-555-1074',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Sylvia',
  'client76@example.com',
  '716-555-1075',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Tajwar',
  'client77@example.com',
  '716-555-1076',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Tasheen',
  'client78@example.com',
  '716-555-1077',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Thatius',
  'client79@example.com',
  '716-555-1078',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Tom',
  'client80@example.com',
  '716-555-1079',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Tony',
  'client81@example.com',
  '716-555-1080',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Tyler',
  'client82@example.com',
  '716-555-1081',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Vernon',
  'client83@example.com',
  '716-555-1082',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Vic',
  'client84@example.com',
  '716-555-1083',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Vicky',
  'client85@example.com',
  '716-555-1084',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Weston',
  'client86@example.com',
  '716-555-1085',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, organization_id, created_at)
VALUES (
  gen_random_uuid(),
  'Zack',
  'client87@example.com',
  '716-555-1086',
  'private_pay',
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts'),
  NOW()
);


-- Verify the data
SELECT 'Users' as table_name, COUNT(*) as count FROM users WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');
