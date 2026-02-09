-- Add contractor_pay_schedule column (must run before setting values)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS contractor_pay_schedule JSONB DEFAULT NULL;

-- Update service types and contractor rates based on owner's spreadsheet
-- =============================================
-- ASSUMPTIONS:
--   - All individual music types pay contractors $38.50 at 30 min, $54.00 at 45 min
--   - In-Home Individual ($50/23%) and Matt's Music ($55/30%) already give $38.50
--     via formula at 30 min, but need schedule overrides at 45 min ($54 vs formula $57.75)
--   - Musical Expressions charges $60 (not $50), needs schedule at both durations
--   - Groups: $60 flat, 0% MCA — contractor gets full amount, no schedule needed
--   - Art individual: $40/20% → contractor $32 at 30 min via formula, ~$45 at 45 min
--   - Admin: $25/0% — contractor gets full amount, no schedule needed

-- =============================================
-- 1. SERVICE TYPE PAY SCHEDULES
-- =============================================

-- Musical Expressions: base_rate $50 → $60, contractor pay $38.50/30min, $54.00/45min
UPDATE service_types
SET base_rate = 60,
    contractor_pay_schedule = '{"30": 38.50, "45": 54.00}'::jsonb,
    updated_at = now()
WHERE name = 'Musical Expressions'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- In-Home Individual: formula gives $38.50 at 30 min already, but 45 min needs override
-- Formula 45 min = $57.75, actual should be $54.00 (same as other individual music)
UPDATE service_types
SET contractor_pay_schedule = '{"30": 38.50, "45": 54.00}'::jsonb,
    updated_at = now()
WHERE name IN ('In-Home Individual Session', 'In-Home Individual Music Therapy')
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Matt's Music Individual: formula gives $38.50 at 30 min already, 45 min needs override
-- Formula 45 min = $57.75, actual should be $54.00
UPDATE service_types
SET contractor_pay_schedule = '{"30": 38.50, "45": 54.00}'::jsonb,
    updated_at = now()
WHERE name = 'Matt''s Music Individual'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Creative Remedies (Art): $40 base, 20% MCA → $32 at 30 min via formula
-- 45 min estimated at $45.00 (same non-linear ratio as music types)
UPDATE service_types
SET contractor_pay_schedule = '{"30": 32.00, "45": 45.00}'::jsonb,
    updated_at = now()
WHERE name = 'Creative Remedies (Art)'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Individual Art Lesson (seed name): same as Creative Remedies
UPDATE service_types
SET contractor_pay_schedule = '{"30": 32.00, "45": 45.00}'::jsonb,
    updated_at = now()
WHERE name = 'Individual Art Lesson'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Groups: 0% MCA, contractor gets full amount — formula handles this correctly
-- No pay schedule needed (In-Home Group, Matt's Music Group, Group Art Lesson)

-- Admin: 0% MCA, $25 flat — formula handles correctly, no schedule needed

-- =============================================
-- 2. CONTRACTOR PAY INCREASES (bonus per session)
-- =============================================

UPDATE users SET pay_increase = 2.00, updated_at = now()  -- Colleen
WHERE email = 'cmilholland17@gmail.com'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

UPDATE users SET pay_increase = 2.00, updated_at = now()  -- Caroline
WHERE email = 'carolinewestmt@gmail.com'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

UPDATE users SET pay_increase = 0.50, updated_at = now()  -- Megan
WHERE email = 'megan.brunner250@gmail.com'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

UPDATE users SET pay_increase = 1.50, updated_at = now()  -- Jacob
WHERE email = 'jacob@soundtransformationsmt.com'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

UPDATE users SET pay_increase = 2.00, updated_at = now()  -- Katie
WHERE email = 'creativeremedies23@gmail.com'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

UPDATE users SET pay_increase = 1.50, updated_at = now()  -- Miley
WHERE email = 'miley.heislermt@gmail.com'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- TBD: Brianna and Madeline (waiting on Amara)
-- UPDATE users SET pay_increase = ?, updated_at = now()
-- WHERE email = 'briannanilsen@gmail.com';
-- UPDATE users SET pay_increase = ?, updated_at = now()
-- WHERE email = 'madelinegilbert027@gmail.com';

-- =============================================
-- 3. COLLEEN'S CUSTOM RATE
-- =============================================
-- $39.50 for Musical Expressions 30-min (vs $38.50 default)

INSERT INTO contractor_rates (contractor_id, service_type_id, contractor_pay)
SELECT u.id, st.id, 39.50
FROM users u
CROSS JOIN service_types st
WHERE u.email = 'cmilholland17@gmail.com'
  AND st.name = 'Musical Expressions'
  AND st.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
ON CONFLICT (contractor_id, service_type_id)
DO UPDATE SET contractor_pay = 39.50, updated_at = now();

-- =============================================
-- VERIFY
-- =============================================

SELECT name, base_rate, mca_percentage, contractor_pay_schedule
FROM service_types
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND is_active = true
ORDER BY display_order;

SELECT name, email, pay_increase
FROM users
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND role = 'contractor'
ORDER BY name;

SELECT u.name as contractor, st.name as service_type, cr.contractor_pay
FROM contractor_rates cr
JOIN users u ON u.id = cr.contractor_id
JOIN service_types st ON st.id = cr.service_type_id
ORDER BY u.name, st.name;
