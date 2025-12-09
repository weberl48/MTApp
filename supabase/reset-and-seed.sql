-- Reset and Seed Script for MCA App
-- This script clears all existing data and seeds fresh data

-- =============================================
-- STEP 1: Disable foreign key checks and clear all data
-- =============================================

-- Delete in order respecting foreign keys (child tables first)
DELETE FROM invoices;
DELETE FROM session_attendees;
DELETE FROM sessions;
DELETE FROM clients;
DELETE FROM service_types;
DELETE FROM users;

-- =============================================
-- STEP 2: Seed Service Types (pricing configuration)
-- =============================================

INSERT INTO service_types (id, name, category, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage, location) VALUES
  -- In-Home Individual
  ('st-001', 'In-Home Individual Music Therapy', 'individual', 50.00, 0, 23, NULL, 0, 'in_home'),

  -- In-Home Group
  ('st-002', 'In-Home Group Music Therapy', 'group', 50.00, 20.00, 30, 105.00, 0, 'in_home'),

  -- Matt''s Music Individual
  ('st-003', 'Matt''s Music Individual Session', 'individual', 55.00, 0, 30, NULL, 10, 'matts_music'),

  -- Matt''s Music Group
  ('st-004', 'Matt''s Music Group Session', 'group', 50.00, 20.00, 30, NULL, 10, 'matts_music'),

  -- Individual Art Lessons
  ('st-005', 'Individual Art Lesson', 'individual', 40.00, 0, 20, NULL, 0, 'in_home'),

  -- Group Art Lessons
  ('st-006', 'Group Art Lesson', 'group', 40.00, 15.00, 30, NULL, 0, 'in_home');

-- =============================================
-- STEP 3: Seed Users (Admin and Contractors)
-- =============================================

-- Note: These users need to exist in Supabase Auth first, or use service role to create
-- For now, we'll insert with placeholder IDs that can be updated

INSERT INTO users (id, email, name, role, phone, payment_info) VALUES
  -- Admin
  ('00000000-0000-0000-0000-000000000001', 'amara@maycreativearts.com', 'Amara May', 'admin', '555-100-0001', '{"method": "direct_deposit", "account_last4": "1234"}'),

  -- Contractors
  ('00000000-0000-0000-0000-000000000002', 'sarah.johnson@email.com', 'Sarah Johnson', 'contractor', '555-200-0002', '{"method": "check"}'),
  ('00000000-0000-0000-0000-000000000003', 'mike.chen@email.com', 'Michael Chen', 'contractor', '555-200-0003', '{"method": "direct_deposit", "account_last4": "5678"}'),
  ('00000000-0000-0000-0000-000000000004', 'lisa.rodriguez@email.com', 'Lisa Rodriguez', 'contractor', '555-200-0004', '{"method": "venmo", "handle": "@lisa-r"}'),
  ('00000000-0000-0000-0000-000000000005', 'david.kim@email.com', 'David Kim', 'contractor', '555-200-0005', '{"method": "check"}');

-- =============================================
-- STEP 4: Seed Clients
-- =============================================

INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, notes, created_at) VALUES
  -- Private Pay Clients
  ('cl-001', 'Emma Thompson', 'emma.t@email.com', '555-300-0001', 'private_pay', 'Prefers morning sessions. Goals: improve fine motor skills through drumming.', NOW() - INTERVAL '6 months'),
  ('cl-002', 'James Wilson', 'jwilson@email.com', '555-300-0002', 'private_pay', 'Adult client, recovering from stroke. Music therapy for cognitive rehabilitation.', NOW() - INTERVAL '5 months'),
  ('cl-003', 'Olivia Martinez', 'olivia.m.parent@email.com', '555-300-0003', 'private_pay', 'Age 8. ASD diagnosis. Responds well to guitar and singing activities.', NOW() - INTERVAL '4 months'),

  -- Self-Directed Clients
  ('cl-004', 'Noah Brown', 'noah.b.guardian@email.com', '555-300-0004', 'self_directed', 'Self-directed waiver client. Billing goes to PA DHS. Allow extra time for payment.', NOW() - INTERVAL '8 months'),
  ('cl-005', 'Ava Garcia', 'ava.g.family@email.com', '555-300-0005', 'self_directed', 'Uses adaptive instruments. Session notes required for waiver documentation.', NOW() - INTERVAL '7 months'),
  ('cl-006', 'Liam Davis', 'ldavis.support@email.com', '555-300-0006', 'self_directed', 'Group session participant. Excellent peer interaction during music activities.', NOW() - INTERVAL '3 months'),

  -- Group Home Clients
  ('cl-007', 'Sophia Anderson', 'greenmeadows.gh@email.com', '555-300-0007', 'group_home', 'Green Meadows Group Home resident. Contact: Mary (house manager). Billing monthly.', NOW() - INTERVAL '10 months'),
  ('cl-008', 'Mason Taylor', 'greenmeadows.gh@email.com', '555-300-0008', 'group_home', 'Green Meadows Group Home. Same billing contact as Sophia.', NOW() - INTERVAL '10 months'),
  ('cl-009', 'Isabella White', 'sunrisehome@email.com', '555-300-0009', 'group_home', 'Sunrise Community Home. Participates in group sessions only.', NOW() - INTERVAL '6 months'),

  -- Scholarship Clients
  ('cl-010', 'Ethan Harris', 'ethan.h.mom@email.com', '555-300-0010', 'scholarship', 'Scholarship recipient 2024. Review eligibility in December.', NOW() - INTERVAL '4 months'),
  ('cl-011', 'Mia Clark', 'clark.family@email.com', '555-300-0011', 'scholarship', 'Partial scholarship (50%). Family pays remainder.', NOW() - INTERVAL '2 months'),

  -- Additional Clients for variety
  ('cl-012', 'Alexander Lee', 'alex.lee@email.com', '555-300-0012', 'private_pay', 'Adult learner. Art lessons - watercolor focus.', NOW() - INTERVAL '1 month'),
  ('cl-013', 'Charlotte King', 'c.king.parent@email.com', '555-300-0013', 'private_pay', 'Age 12. Piano lessons at Matt''s Music location.', NOW() - INTERVAL '3 months'),
  ('cl-014', 'Benjamin Scott', 'b.scott@email.com', '555-300-0014', 'self_directed', 'Attends both individual and group sessions.', NOW() - INTERVAL '5 months'),
  ('cl-015', 'Amelia Young', 'sunrisehome@email.com', '555-300-0015', 'group_home', 'Sunrise Community Home. Art therapy focus.', NOW() - INTERVAL '4 months');

-- =============================================
-- STEP 5: Seed Sessions (last 3 months of data)
-- =============================================

-- Sessions for Sarah Johnson (Contractor)
INSERT INTO sessions (id, contractor_id, service_type_id, date, duration_minutes, location, status, notes, created_at) VALUES
  -- November sessions
  ('sess-001', '00000000-0000-0000-0000-000000000002', 'st-001', '2024-11-04 10:00:00', 30, 'Client home - Emma', 'approved', 'Worked on rhythm exercises. Emma showed improvement in timing.', '2024-11-04'),
  ('sess-002', '00000000-0000-0000-0000-000000000002', 'st-001', '2024-11-11 10:00:00', 30, 'Client home - Emma', 'approved', 'Introduced new drum patterns. Excellent engagement.', '2024-11-11'),
  ('sess-003', '00000000-0000-0000-0000-000000000002', 'st-002', '2024-11-06 14:00:00', 60, 'Green Meadows Group Home', 'approved', 'Group session with 3 participants. Singing and movement activities.', '2024-11-06'),
  ('sess-004', '00000000-0000-0000-0000-000000000002', 'st-001', '2024-11-18 10:00:00', 30, 'Client home - Emma', 'approved', 'Progress assessment. Met 2 of 3 monthly goals.', '2024-11-18'),
  ('sess-005', '00000000-0000-0000-0000-000000000002', 'st-002', '2024-11-20 14:00:00', 60, 'Green Meadows Group Home', 'approved', 'Thanksgiving themed music activities. Great participation.', '2024-11-20'),

  -- December sessions (some pending)
  ('sess-006', '00000000-0000-0000-0000-000000000002', 'st-001', '2024-12-02 10:00:00', 30, 'Client home - Emma', 'approved', 'Continued rhythm work. Added xylophone exercises.', '2024-12-02'),
  ('sess-007', '00000000-0000-0000-0000-000000000002', 'st-002', '2024-12-04 14:00:00', 60, 'Green Meadows Group Home', 'submitted', 'Holiday music session. 4 participants today.', '2024-12-04'),
  ('sess-008', '00000000-0000-0000-0000-000000000002', 'st-001', '2024-12-09 10:00:00', 30, 'Client home - Emma', 'draft', 'Working on new song. Emma requested learning guitar basics.', '2024-12-09');

-- Sessions for Michael Chen (Contractor)
INSERT INTO sessions (id, contractor_id, service_type_id, date, duration_minutes, location, status, notes, created_at) VALUES
  ('sess-009', '00000000-0000-0000-0000-000000000003', 'st-003', '2024-11-05 15:00:00', 45, 'Matt''s Music Studio A', 'approved', 'Piano lesson with Charlotte. Working on scales and simple pieces.', '2024-11-05'),
  ('sess-010', '00000000-0000-0000-0000-000000000003', 'st-003', '2024-11-12 15:00:00', 45, 'Matt''s Music Studio A', 'approved', 'Introduced "Für Elise" simplified version. Good progress.', '2024-11-12'),
  ('sess-011', '00000000-0000-0000-0000-000000000003', 'st-001', '2024-11-08 11:00:00', 30, 'Client home - James', 'approved', 'Cognitive rehab session. Memory exercises through familiar songs.', '2024-11-08'),
  ('sess-012', '00000000-0000-0000-0000-000000000003', 'st-003', '2024-11-19 15:00:00', 45, 'Matt''s Music Studio A', 'approved', 'Charlotte performing well. Ready for winter recital piece.', '2024-11-19'),
  ('sess-013', '00000000-0000-0000-0000-000000000003', 'st-001', '2024-11-22 11:00:00', 30, 'Client home - James', 'approved', 'Great session. James recalled lyrics from therapy songs.', '2024-11-22'),
  ('sess-014', '00000000-0000-0000-0000-000000000003', 'st-003', '2024-12-03 15:00:00', 45, 'Matt''s Music Studio A', 'approved', 'Recital prep. Charlotte gaining confidence.', '2024-12-03'),
  ('sess-015', '00000000-0000-0000-0000-000000000003', 'st-001', '2024-12-06 11:00:00', 30, 'Client home - James', 'submitted', 'Holiday songs session. Family joined briefly.', '2024-12-06');

-- Sessions for Lisa Rodriguez (Art Therapy)
INSERT INTO sessions (id, contractor_id, service_type_id, date, duration_minutes, location, status, notes, created_at) VALUES
  ('sess-016', '00000000-0000-0000-0000-000000000004', 'st-005', '2024-11-07 13:00:00', 45, 'Client home - Alexander', 'approved', 'Watercolor basics. Alexander showed natural aptitude for color mixing.', '2024-11-07'),
  ('sess-017', '00000000-0000-0000-0000-000000000004', 'st-006', '2024-11-14 14:00:00', 60, 'Sunrise Community Home', 'approved', 'Group art session. Collage project - theme: gratitude.', '2024-11-14'),
  ('sess-018', '00000000-0000-0000-0000-000000000004', 'st-005', '2024-11-21 13:00:00', 45, 'Client home - Alexander', 'approved', 'Landscape painting. Beautiful autumn scene completed.', '2024-11-21'),
  ('sess-019', '00000000-0000-0000-0000-000000000004', 'st-006', '2024-11-28 14:00:00', 60, 'Sunrise Community Home', 'approved', 'Holiday card making. All participants engaged.', '2024-11-28'),
  ('sess-020', '00000000-0000-0000-0000-000000000004', 'st-005', '2024-12-05 13:00:00', 45, 'Client home - Alexander', 'submitted', 'Started winter landscape series. Client very motivated.', '2024-12-05');

-- Sessions for David Kim
INSERT INTO sessions (id, contractor_id, service_type_id, date, duration_minutes, location, status, notes, created_at) VALUES
  ('sess-021', '00000000-0000-0000-0000-000000000005', 'st-001', '2024-11-06 09:00:00', 30, 'Client home - Olivia', 'approved', 'Guitar exploration. Olivia responded well to strumming patterns.', '2024-11-06'),
  ('sess-022', '00000000-0000-0000-0000-000000000005', 'st-001', '2024-11-13 09:00:00', 30, 'Client home - Olivia', 'approved', 'Singing session. Used visual supports for song choices.', '2024-11-13'),
  ('sess-023', '00000000-0000-0000-0000-000000000005', 'st-002', '2024-11-15 10:30:00', 60, 'Community Center', 'approved', 'Mixed group session. 4 self-directed waiver clients.', '2024-11-15'),
  ('sess-024', '00000000-0000-0000-0000-000000000005', 'st-001', '2024-11-20 09:00:00', 30, 'Client home - Olivia', 'approved', 'Introduced ukulele. Excellent fine motor practice.', '2024-11-20'),
  ('sess-025', '00000000-0000-0000-0000-000000000005', 'st-001', '2024-12-04 09:00:00', 30, 'Client home - Olivia', 'approved', 'Holiday songs with instruments. Parent reported improved focus at home.', '2024-12-04'),
  ('sess-026', '00000000-0000-0000-0000-000000000005', 'st-002', '2024-12-06 10:30:00', 60, 'Community Center', 'draft', 'Group rhythm activities. Working on turn-taking skills.', '2024-12-06');

-- =============================================
-- STEP 6: Seed Session Attendees
-- =============================================

-- Emma's sessions (individual)
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  ('sess-001', 'cl-001', 50.00),
  ('sess-002', 'cl-001', 50.00),
  ('sess-004', 'cl-001', 50.00),
  ('sess-006', 'cl-001', 50.00),
  ('sess-008', 'cl-001', 50.00);

-- Group Home sessions (multiple attendees)
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  -- sess-003: Group session with 3 people ($50 + $20 + $20 = $90 / 3 = $30 each)
  ('sess-003', 'cl-007', 30.00),
  ('sess-003', 'cl-008', 30.00),
  ('sess-003', 'cl-006', 30.00),
  -- sess-005: Group session with 3 people
  ('sess-005', 'cl-007', 30.00),
  ('sess-005', 'cl-008', 30.00),
  ('sess-005', 'cl-006', 30.00),
  -- sess-007: Group session with 4 people ($50 + $20 + $20 + $20 = $110 / 4 = $27.50 each)
  ('sess-007', 'cl-007', 27.50),
  ('sess-007', 'cl-008', 27.50),
  ('sess-007', 'cl-006', 27.50),
  ('sess-007', 'cl-014', 27.50);

-- Charlotte's piano sessions (Matt's Music)
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  ('sess-009', 'cl-013', 55.00),
  ('sess-010', 'cl-013', 55.00),
  ('sess-012', 'cl-013', 55.00),
  ('sess-014', 'cl-013', 55.00);

-- James's sessions (individual)
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  ('sess-011', 'cl-002', 50.00),
  ('sess-013', 'cl-002', 50.00),
  ('sess-015', 'cl-002', 50.00);

-- Alexander's art sessions (individual)
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  ('sess-016', 'cl-012', 40.00),
  ('sess-018', 'cl-012', 40.00),
  ('sess-020', 'cl-012', 40.00);

-- Sunrise Home group art sessions
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  -- sess-017: 3 people ($40 + $15 + $15 = $70 / 3 = $23.33)
  ('sess-017', 'cl-009', 23.33),
  ('sess-017', 'cl-015', 23.33),
  ('sess-017', 'cl-010', 23.34),
  -- sess-019: 3 people
  ('sess-019', 'cl-009', 23.33),
  ('sess-019', 'cl-015', 23.33),
  ('sess-019', 'cl-010', 23.34);

-- Olivia's sessions (individual)
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  ('sess-021', 'cl-003', 50.00),
  ('sess-022', 'cl-003', 50.00),
  ('sess-024', 'cl-003', 50.00),
  ('sess-025', 'cl-003', 50.00);

-- Mixed group sessions
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
  -- sess-023: 4 self-directed clients ($50 + $20*3 = $110 / 4 = $27.50)
  ('sess-023', 'cl-004', 27.50),
  ('sess-023', 'cl-005', 27.50),
  ('sess-023', 'cl-006', 27.50),
  ('sess-023', 'cl-014', 27.50),
  -- sess-026: 4 clients (draft)
  ('sess-026', 'cl-004', 27.50),
  ('sess-026', 'cl-005', 27.50),
  ('sess-026', 'cl-011', 27.50),
  ('sess-026', 'cl-014', 27.50);

-- =============================================
-- STEP 7: Seed Invoices
-- =============================================

-- Invoices for approved sessions
-- Formula: amount = individual_cost, mca_cut = amount * mca_percentage, contractor_pay = amount - mca_cut - rent

-- Emma's invoices (Private Pay, 23% MCA cut)
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  ('inv-001', 'sess-001', 'cl-001', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-11-18', '2024-11-15', '2024-11-04'),
  ('inv-002', 'sess-002', 'cl-001', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-11-25', '2024-11-22', '2024-11-11'),
  ('inv-003', 'sess-004', 'cl-001', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-12-02', '2024-11-29', '2024-11-18'),
  ('inv-004', 'sess-006', 'cl-001', 50.00, 11.50, 38.50, 0, 'sent', 'private_pay', '2024-12-16', NULL, '2024-12-02');

-- Group Home invoices (30% MCA cut, contractor cap $105)
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  -- sess-003: $90 total, 30% = $27 MCA, $63 contractor (under cap)
  ('inv-005', 'sess-003', 'cl-007', 30.00, 9.00, 21.00, 0, 'paid', 'group_home', '2024-12-06', '2024-12-01', '2024-11-06'),
  ('inv-006', 'sess-003', 'cl-008', 30.00, 9.00, 21.00, 0, 'paid', 'group_home', '2024-12-06', '2024-12-01', '2024-11-06'),
  ('inv-007', 'sess-003', 'cl-006', 30.00, 9.00, 21.00, 0, 'paid', 'self_directed', '2024-12-06', '2024-12-03', '2024-11-06'),
  -- sess-005: Same pricing
  ('inv-008', 'sess-005', 'cl-007', 30.00, 9.00, 21.00, 0, 'paid', 'group_home', '2024-12-20', '2024-12-05', '2024-11-20'),
  ('inv-009', 'sess-005', 'cl-008', 30.00, 9.00, 21.00, 0, 'paid', 'group_home', '2024-12-20', '2024-12-05', '2024-11-20'),
  ('inv-010', 'sess-005', 'cl-006', 30.00, 9.00, 21.00, 0, 'sent', 'self_directed', '2024-12-20', NULL, '2024-11-20');

-- Charlotte's piano invoices (Matt's Music, 30% MCA, 10% rent)
-- $55 base, 30% MCA = $16.50, 10% rent = $5.50, contractor = $33
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  ('inv-011', 'sess-009', 'cl-013', 55.00, 16.50, 33.00, 5.50, 'paid', 'private_pay', '2024-11-19', '2024-11-18', '2024-11-05'),
  ('inv-012', 'sess-010', 'cl-013', 55.00, 16.50, 33.00, 5.50, 'paid', 'private_pay', '2024-11-26', '2024-11-25', '2024-11-12'),
  ('inv-013', 'sess-012', 'cl-013', 55.00, 16.50, 33.00, 5.50, 'paid', 'private_pay', '2024-12-03', '2024-12-02', '2024-11-19'),
  ('inv-014', 'sess-014', 'cl-013', 55.00, 16.50, 33.00, 5.50, 'sent', 'private_pay', '2024-12-17', NULL, '2024-12-03');

-- James's invoices (23% MCA)
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  ('inv-015', 'sess-011', 'cl-002', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-11-22', '2024-11-20', '2024-11-08'),
  ('inv-016', 'sess-013', 'cl-002', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-12-06', '2024-12-04', '2024-11-22');

-- Alexander's art invoices (20% MCA)
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  ('inv-017', 'sess-016', 'cl-012', 40.00, 8.00, 32.00, 0, 'paid', 'private_pay', '2024-11-21', '2024-11-19', '2024-11-07'),
  ('inv-018', 'sess-018', 'cl-012', 40.00, 8.00, 32.00, 0, 'paid', 'private_pay', '2024-12-05', '2024-12-03', '2024-11-21');

-- Group art session invoices (30% MCA)
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  ('inv-019', 'sess-017', 'cl-009', 23.33, 7.00, 16.33, 0, 'paid', 'group_home', '2024-12-14', '2024-12-10', '2024-11-14'),
  ('inv-020', 'sess-017', 'cl-015', 23.33, 7.00, 16.33, 0, 'paid', 'group_home', '2024-12-14', '2024-12-10', '2024-11-14'),
  ('inv-021', 'sess-017', 'cl-010', 23.34, 7.00, 16.34, 0, 'paid', 'scholarship', '2024-12-14', '2024-12-10', '2024-11-14'),
  ('inv-022', 'sess-019', 'cl-009', 23.33, 7.00, 16.33, 0, 'sent', 'group_home', '2024-12-28', NULL, '2024-11-28'),
  ('inv-023', 'sess-019', 'cl-015', 23.33, 7.00, 16.33, 0, 'sent', 'group_home', '2024-12-28', NULL, '2024-11-28'),
  ('inv-024', 'sess-019', 'cl-010', 23.34, 7.00, 16.34, 0, 'sent', 'scholarship', '2024-12-28', NULL, '2024-11-28');

-- Olivia's invoices (23% MCA)
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  ('inv-025', 'sess-021', 'cl-003', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-11-20', '2024-11-18', '2024-11-06'),
  ('inv-026', 'sess-022', 'cl-003', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-11-27', '2024-11-25', '2024-11-13'),
  ('inv-027', 'sess-024', 'cl-003', 50.00, 11.50, 38.50, 0, 'paid', 'private_pay', '2024-12-04', '2024-12-02', '2024-11-20'),
  ('inv-028', 'sess-025', 'cl-003', 50.00, 11.50, 38.50, 0, 'sent', 'private_pay', '2024-12-18', NULL, '2024-12-04');

-- Group session invoices (sess-023, 30% MCA with cap)
INSERT INTO invoices (id, session_id, client_id, amount, mca_cut, contractor_pay, rent_amount, status, payment_method, due_date, paid_date, created_at) VALUES
  ('inv-029', 'sess-023', 'cl-004', 27.50, 8.25, 19.25, 0, 'paid', 'self_directed', '2024-12-15', '2024-12-08', '2024-11-15'),
  ('inv-030', 'sess-023', 'cl-005', 27.50, 8.25, 19.25, 0, 'paid', 'self_directed', '2024-12-15', '2024-12-10', '2024-11-15'),
  ('inv-031', 'sess-023', 'cl-006', 27.50, 8.25, 19.25, 0, 'sent', 'self_directed', '2024-12-15', NULL, '2024-11-15'),
  ('inv-032', 'sess-023', 'cl-014', 27.50, 8.25, 19.25, 0, 'pending', 'self_directed', '2024-12-15', NULL, '2024-11-15');

-- =============================================
-- Summary of seeded data:
-- =============================================
-- 6 Service Types
-- 5 Users (1 admin, 4 contractors)
-- 15 Clients
-- 26 Sessions (various statuses)
-- ~45 Session Attendees
-- 32 Invoices (various statuses: paid, sent, pending)
