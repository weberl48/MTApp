-- Add contractor_pay_schedule column (must run before setting values)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS contractor_pay_schedule JSONB DEFAULT NULL;

-- Update service types and contractor rates based on owner's spreadsheet
-- =============================================
-- ASSUMPTIONS:
--   - All individual music types pay contractors $38.50 base at 30 min
--   - Pay schedule increments: +$15.50 per 15-min block for music, +$13 per 15-min block for art
--   - Groups: $60 flat, 0% MCA — contractor gets full amount, no schedule needed
--   - Art individual: $40/20% → contractor $32 at 30 min via formula
--   - Admin: $25/0% — contractor gets full amount, no schedule needed
--   - Raises are baked directly into contractor_rates (no more users.pay_increase)

-- =============================================
-- 1. SERVICE TYPE PAY SCHEDULES (base contractor pay per duration)
-- =============================================

-- Musical Expressions: base_rate $60, contractor base pay by duration
UPDATE service_types
SET base_rate = 60,
    contractor_pay_schedule = '{"30": 38.50, "45": 54.00, "60": 69.50, "75": 85.00, "90": 100.50}'::jsonb,
    updated_at = now()
WHERE name = 'Musical Expressions'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- In-Home Individual: $50/23%, contractor base pay by duration
UPDATE service_types
SET contractor_pay_schedule = '{"30": 38.50, "45": 54.00, "60": 69.50, "75": 85.00, "90": 100.50}'::jsonb,
    updated_at = now()
WHERE name IN ('In-Home Individual Session', 'In-Home Individual Music Therapy')
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Matt's Music Individual: $55/30%, contractor base pay by duration
UPDATE service_types
SET contractor_pay_schedule = '{"30": 38.50, "45": 54.00, "60": 69.50, "75": 85.00, "90": 100.50}'::jsonb,
    updated_at = now()
WHERE name = 'Matt''s Music Individual'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Creative Remedies (Art): $40/20%, art pay schedule
UPDATE service_types
SET contractor_pay_schedule = '{"30": 32.00, "45": 45.00, "60": 58.00, "75": 71.00, "90": 84.00}'::jsonb,
    updated_at = now()
WHERE name = 'Creative Remedies (Art)'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Individual Art Lesson (seed name): same as Creative Remedies
UPDATE service_types
SET contractor_pay_schedule = '{"30": 32.00, "45": 45.00, "60": 58.00, "75": 71.00, "90": 84.00}'::jsonb,
    updated_at = now()
WHERE name = 'Individual Art Lesson'
  AND organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Groups: 0% MCA, contractor gets full amount — formula handles correctly, no schedule needed
-- Admin: 0% MCA, $25 flat — formula handles correctly, no schedule needed

-- =============================================
-- 2. CONTRACTOR RATES (30-min rate with raise baked in)
-- =============================================
-- Each contractor gets a rate for every individual service type.
-- Groups are excluded (0% MCA, contractor gets full charge amount).
--
-- Contractor final 30-min rates (base $38.50 + raise):
--   Colleen:  +$2.00 → $40.50
--   Caroline: +$2.00 → $40.50
--   Megan:    +$0.50 → $39.00
--   Jacob:    +$1.50 → $40.00
--   Katie:    +$2.00 → $40.50
--   Miley:    +$1.50 → $40.00
--
-- Brianna and Madeline: haven't started yet — inactive, no rates needed.

-- Helper: insert rate for every individual service type for a given contractor
-- Using a cross join with all active individual service types (non-group)

-- Colleen — $40.50
INSERT INTO contractor_rates (contractor_id, service_type_id, contractor_pay)
SELECT u.id, st.id, 40.50
FROM users u
CROSS JOIN service_types st
WHERE u.email = 'cmilholland17@gmail.com'
  AND u.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND st.organization_id = u.organization_id
  AND st.is_active = true
  AND st.per_person_rate = 0
  AND st.mca_percentage > 0
ON CONFLICT (contractor_id, service_type_id)
DO UPDATE SET contractor_pay = 40.50, updated_at = now();

-- Caroline — $40.50
INSERT INTO contractor_rates (contractor_id, service_type_id, contractor_pay)
SELECT u.id, st.id, 40.50
FROM users u
CROSS JOIN service_types st
WHERE u.email = 'carolinewestmt@gmail.com'
  AND u.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND st.organization_id = u.organization_id
  AND st.is_active = true
  AND st.per_person_rate = 0
  AND st.mca_percentage > 0
ON CONFLICT (contractor_id, service_type_id)
DO UPDATE SET contractor_pay = 40.50, updated_at = now();

-- Megan — $39.00
INSERT INTO contractor_rates (contractor_id, service_type_id, contractor_pay)
SELECT u.id, st.id, 39.00
FROM users u
CROSS JOIN service_types st
WHERE u.email = 'megan.brunner250@gmail.com'
  AND u.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND st.organization_id = u.organization_id
  AND st.is_active = true
  AND st.per_person_rate = 0
  AND st.mca_percentage > 0
ON CONFLICT (contractor_id, service_type_id)
DO UPDATE SET contractor_pay = 39.00, updated_at = now();

-- Jacob — $40.00
INSERT INTO contractor_rates (contractor_id, service_type_id, contractor_pay)
SELECT u.id, st.id, 40.00
FROM users u
CROSS JOIN service_types st
WHERE u.email = 'jacob@soundtransformationsmt.com'
  AND u.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND st.organization_id = u.organization_id
  AND st.is_active = true
  AND st.per_person_rate = 0
  AND st.mca_percentage > 0
ON CONFLICT (contractor_id, service_type_id)
DO UPDATE SET contractor_pay = 40.00, updated_at = now();

-- Katie — $40.50
INSERT INTO contractor_rates (contractor_id, service_type_id, contractor_pay)
SELECT u.id, st.id, 40.50
FROM users u
CROSS JOIN service_types st
WHERE u.email = 'creativeremedies23@gmail.com'
  AND u.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND st.organization_id = u.organization_id
  AND st.is_active = true
  AND st.per_person_rate = 0
  AND st.mca_percentage > 0
ON CONFLICT (contractor_id, service_type_id)
DO UPDATE SET contractor_pay = 40.50, updated_at = now();

-- Miley — $40.00
INSERT INTO contractor_rates (contractor_id, service_type_id, contractor_pay)
SELECT u.id, st.id, 40.00
FROM users u
CROSS JOIN service_types st
WHERE u.email = 'miley.heislermt@gmail.com'
  AND u.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND st.organization_id = u.organization_id
  AND st.is_active = true
  AND st.per_person_rate = 0
  AND st.mca_percentage > 0
ON CONFLICT (contractor_id, service_type_id)
DO UPDATE SET contractor_pay = 40.00, updated_at = now();

-- Clear old pay_increase values (raises now baked into contractor_rates)
UPDATE users SET pay_increase = 0, updated_at = now()
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')
  AND role = 'contractor'
  AND pay_increase > 0;

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
