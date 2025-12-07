-- Seed data for May Creative Arts development
-- Run this in Supabase SQL Editor after running schema.sql

-- Insert service types (pricing configurations)
INSERT INTO service_types (id, name, category, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage, location) VALUES
    ('st000000-0000-0000-0000-000000000001', 'In-Home Individual Session', 'in_home_individual', 50.00, NULL, 23, NULL, NULL, 'in_home'),
    ('st000000-0000-0000-0000-000000000002', 'In-Home Group Session', 'in_home_group', 50.00, 20.00, 30, 105.00, NULL, 'in_home'),
    ('st000000-0000-0000-0000-000000000003', 'Matt''s Music Individual', 'matts_music_individual', 55.00, NULL, 30, NULL, 10, 'matts_music'),
    ('st000000-0000-0000-0000-000000000004', 'Matt''s Music Group', 'matts_music_group', 50.00, 20.00, 30, NULL, NULL, 'matts_music'),
    ('st000000-0000-0000-0000-000000000005', 'Individual Art Lesson', 'art_individual', 40.00, NULL, 20, NULL, NULL, 'studio'),
    ('st000000-0000-0000-0000-000000000006', 'Group Art Lesson', 'art_group', 40.00, 15.00, 30, NULL, NULL, 'studio')
ON CONFLICT (id) DO NOTHING;

-- Insert test clients
INSERT INTO clients (id, name, contact_email, contact_phone, payment_method, notes) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'sarah.j@email.com', '(555) 123-4567', 'private_pay', 'Prefers morning sessions'),
    ('c1000000-0000-0000-0000-000000000002', 'Michael Chen', 'mchen@email.com', '(555) 234-5678', 'self_directed', 'Self-directed program participant'),
    ('c1000000-0000-0000-0000-000000000003', 'Emily Rodriguez', 'emily.r@email.com', '(555) 345-6789', 'group_home', 'Sunrise Group Home resident'),
    ('c1000000-0000-0000-0000-000000000004', 'David Thompson', 'dthompson@email.com', '(555) 456-7890', 'scholarship', 'Scholarship recipient - approved through March'),
    ('c1000000-0000-0000-0000-000000000005', 'Lisa Martinez', 'lisa.m@email.com', '(555) 567-8901', 'private_pay', 'Art therapy focus'),
    ('c1000000-0000-0000-0000-000000000006', 'James Wilson', 'jwilson@email.com', '(555) 678-9012', 'group_home', 'Oakwood Care Center'),
    ('c1000000-0000-0000-0000-000000000007', 'Amanda Foster', 'afoster@email.com', '(555) 789-0123', 'private_pay', 'Weekly sessions'),
    ('c1000000-0000-0000-0000-000000000008', 'Robert Kim', 'rkim@email.com', '(555) 890-1234', 'self_directed', NULL),
    ('c1000000-0000-0000-0000-000000000009', 'Jennifer Lee', 'jlee@email.com', '(555) 901-2345', 'scholarship', 'Music therapy - guitar focus'),
    ('c1000000-0000-0000-0000-000000000010', 'Christopher Brown', 'cbrown@email.com', '(555) 012-3456', 'private_pay', 'Group session participant')
ON CONFLICT (id) DO NOTHING;

-- Insert client goals
INSERT INTO client_goals (client_id, description, status) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Improve vocal range and breath control', 'active'),
    ('c1000000-0000-0000-0000-000000000001', 'Learn 3 new songs by end of quarter', 'active'),
    ('c1000000-0000-0000-0000-000000000002', 'Develop rhythm recognition skills', 'active'),
    ('c1000000-0000-0000-0000-000000000002', 'Increase session engagement time to 45 minutes', 'met'),
    ('c1000000-0000-0000-0000-000000000003', 'Participate in group activities without prompting', 'active'),
    ('c1000000-0000-0000-0000-000000000004', 'Learn basic guitar chords', 'active'),
    ('c1000000-0000-0000-0000-000000000005', 'Express emotions through art', 'active'),
    ('c1000000-0000-0000-0000-000000000005', 'Complete a personal art portfolio', 'active'),
    ('c1000000-0000-0000-0000-000000000007', 'Reduce anxiety through music relaxation', 'met'),
    ('c1000000-0000-0000-0000-000000000009', 'Play a full song on guitar', 'active');

-- Summary: 10 Clients with goals seeded
--
-- To add sessions and invoices, you need to:
-- 1. Sign up through the app at http://localhost:3001/signup
-- 2. Go to Supabase Table Editor > users table
-- 3. Change your role from 'contractor' to 'admin'
-- 4. Refresh the app - you'll now have admin access
-- 5. You can then create sessions through the app
