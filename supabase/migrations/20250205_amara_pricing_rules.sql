-- Amara's Pricing Rules Configuration
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Set scholarship_rate = $60 on all individual service types
-- (Scholarship clients pay flat $60 per session regardless of duration)
UPDATE service_types
SET scholarship_rate = 60
WHERE category IN ('music_individual', 'art_individual')
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- 2. Update group service types: $60 flat, contractor gets full amount (MCA 0%)
UPDATE service_types
SET base_rate = 60,
    per_person_rate = 0,
    mca_percentage = 0,
    contractor_cap = NULL,
    scholarship_rate = 60
WHERE category IN ('music_group', 'art_group')
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- 3. Create "Admin" service type for Colleen ($25/30 min, contractor gets full amount)
INSERT INTO service_types (name, category, location, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage, is_active, organization_id)
SELECT
  'Admin',
  'music_individual',
  'other',
  25.00,
  0,
  0,
  NULL,
  0,
  true,
  (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
WHERE NOT EXISTS (
  SELECT 1 FROM service_types
  WHERE name = 'Admin'
    AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
);

-- 4. Set NTLC clients to scholarship payment method
-- NOTE: Replace the client names below with the actual NTLC client names.
-- Uncomment and edit the line below once you know which clients are NTLC:
--
-- UPDATE clients
-- SET payment_method = 'scholarship'
-- WHERE name IN ('Client Name 1', 'Client Name 2')
--   AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- 5. Update Colleen's role to admin (she's currently listed as contractor)
UPDATE users
SET role = 'admin'
WHERE email = 'colleen@maycreativearts.com'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Verify changes
SELECT 'Service Types' as info, name, base_rate, mca_percentage, scholarship_rate, category
FROM service_types
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
ORDER BY name;

SELECT 'Colleen Role' as info, name, role, email
FROM users
WHERE email = 'colleen@maycreativearts.com';
