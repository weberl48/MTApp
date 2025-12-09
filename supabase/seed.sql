-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE session_attendees CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE client_goals CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE service_types CASCADE;
TRUNCATE TABLE users CASCADE;

-- 1. Insert Service Types
INSERT INTO service_types (id, name, category, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage, location) VALUES
    ('st000000-0000-0000-0000-000000000001', 'In-Home Individual Session', 'in_home_individual', 50.00, 0, 23, NULL, NULL, 'in_home'),
    ('st000000-0000-0000-0000-000000000002', 'In-Home Group Session', 'in_home_group', 50.00, 20.00, 30, 105.00, NULL, 'in_home'),
    ('st000000-0000-0000-0000-000000000003', 'Matt''s Music Individual', 'matts_music_individual', 55.00, 0, 30, NULL, 10, 'matts_music'),
    ('st000000-0000-0000-0000-000000000004', 'Matt''s Music Group', 'matts_music_group', 50.00, 20.00, 30, NULL, NULL, 'matts_music'),
    ('st000000-0000-0000-0000-000000000005', 'Individual Art Lesson', 'art_individual', 40.00, 0, 20, NULL, NULL, 'other'),
    ('st000000-0000-0000-0000-000000000006', 'Group Art Lesson', 'art_group', 40.00, 15.00, 30, NULL, NULL, 'other');

-- 2. Insert Clients
INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, notes) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'sarah.j@email.com', '(555) 123-4567', 'private_pay', 'Prefers morning sessions'),
    ('c1000000-0000-0000-0000-000000000002', 'Michael Chen', 'mchen@email.com', '(555) 234-5678', 'self_directed', 'Self-directed program participant'),
    ('c1000000-0000-0000-0000-000000000003', 'Emily Rodriguez', 'emily.r@email.com', '(555) 345-6789', 'group_home', 'Sunrise Group Home resident'),
    ('c1000000-0000-0000-0000-000000000004', 'David Thompson', 'dthompson@email.com', '(555) 456-7890', 'scholarship', 'Scholarship recipient'),
    ('c1000000-0000-0000-0000-000000000005', 'Lisa Martinez', 'lisa.m@email.com', '(555) 567-8901', 'private_pay', 'Art therapy focus');

-- 3. Insert Users (Auth & Public)
-- Admin User
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@mca.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"name": "Amara Admin", "role": "admin"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Contractor User
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'contractor@mca.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"name": "Connie Contractor", "role": "contractor"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Public Profiles (Triggers might handle this, but explicit insert ensures data)
INSERT INTO public.users (id, email, role, name)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@mca.local', 'admin', 'Amara Admin'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'contractor@mca.local', 'contractor', 'Connie Contractor')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;


-- 4. Insert Sessions
INSERT INTO sessions (id, contractor_id, service_type_id, date, duration_minutes, status, notes) VALUES
    -- Past Sessions
    ('s0000000-0000-0000-0000-000000000001', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'st000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '10 days', 30, 'approved', 'Regular session'),
    ('s0000000-0000-0000-0000-000000000002', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'st000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '8 days', 45, 'approved', 'Group session'),
    ('s0000000-0000-0000-0000-000000000003', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'st000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '5 days', 30, 'submitted', 'Guitar practice'),
    
    -- Future Sessions
    ('s0000000-0000-0000-0000-000000000004', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'st000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '2 days', 30, 'draft', 'Upcoming'),
    ('s0000000-0000-0000-0000-000000000005', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'st000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '5 days', 45, 'draft', 'Group session planned');

-- 5. Insert Attendees
INSERT INTO session_attendees (session_id, client_id, individual_cost) VALUES
    ('s0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 50.00),
    ('s0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 20.00),
    ('s0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 20.00),
    ('s0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 55.00),
    ('s0000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 50.00),
    ('s0000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 20.00),
    ('s0000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 20.00);

-- 6. Insert Invoices (for past sessions)
INSERT INTO invoices (session_id, client_id, amount, mca_cut, contractor_pay, status, payment_method, due_date) VALUES
    ('s0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 50.00, 11.50, 38.50, 'paid', 'private_pay', CURRENT_DATE - INTERVAL '30 days'),
    ('s0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 20.00, 6.00, 14.00, 'sent', 'self_directed', CURRENT_DATE + INTERVAL '22 days'),
    ('s0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 20.00, 6.00, 14.00, 'sent', 'group_home', CURRENT_DATE + INTERVAL '22 days');
