-- Generate invoices for all historical session attendees
-- Uses pricing engine logic to calculate mca_cut, contractor_pay, rent_amount

-- First, delete any existing invoices for this org
DELETE FROM invoices
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Insert invoices for each session_attendee
INSERT INTO invoices (
  id,
  session_id,
  client_id,
  amount,
  mca_cut,
  contractor_pay,
  rent_amount,
  status,
  payment_method,
  due_date,
  paid_date,
  organization_id,
  created_at
)
SELECT
  gen_random_uuid(),
  sa.session_id,
  sa.client_id,
  -- Amount is the individual_cost from session_attendees
  sa.individual_cost AS amount,
  -- MCA cut based on service type percentage
  ROUND((sa.individual_cost * st.mca_percentage / 100)::numeric, 2) AS mca_cut,
  -- Contractor pay = amount - mca_cut - rent
  ROUND((sa.individual_cost - (sa.individual_cost * st.mca_percentage / 100) - (sa.individual_cost * st.rent_percentage / 100))::numeric, 2) AS contractor_pay,
  -- Rent amount based on service type
  ROUND((sa.individual_cost * st.rent_percentage / 100)::numeric, 2) AS rent_amount,
  -- All historical invoices marked as paid
  'paid' AS status,
  -- Default payment method
  'private_pay' AS payment_method,
  -- Due date = session date + 30 days
  (s.date::date + INTERVAL '30 days')::date AS due_date,
  -- Paid date = session date (since historical)
  s.date::date AS paid_date,
  s.organization_id,
  s.created_at
FROM session_attendees sa
JOIN sessions s ON sa.session_id = s.id
JOIN service_types st ON s.service_type_id = st.id
WHERE s.organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');

-- Verify the data
SELECT
  'Invoices Created' as metric,
  COUNT(*) as count
FROM invoices
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')

UNION ALL

SELECT
  'Total Amount Billed',
  SUM(amount)::bigint
FROM invoices
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')

UNION ALL

SELECT
  'Total MCA Revenue',
  SUM(mca_cut)::bigint
FROM invoices
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts')

UNION ALL

SELECT
  'Total Contractor Pay',
  SUM(contractor_pay)::bigint
FROM invoices
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'may-creative-arts');
