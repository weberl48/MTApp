-- May Creative Arts Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'contractor');
CREATE TYPE session_status AS ENUM ('draft', 'submitted', 'approved');
CREATE TYPE invoice_status AS ENUM ('pending', 'sent', 'paid');
CREATE TYPE payment_method AS ENUM ('private_pay', 'self_directed', 'group_home', 'scholarship');
CREATE TYPE goal_status AS ENUM ('active', 'met', 'not_met');
CREATE TYPE location_type AS ENUM ('in_home', 'matts_music', 'other');
CREATE TYPE service_category AS ENUM ('music_individual', 'music_group', 'art_individual', 'art_group');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'contractor',
    name TEXT NOT NULL,
    phone TEXT,
    payment_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    payment_method payment_method NOT NULL DEFAULT 'private_pay',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Types table (pricing configuration)
CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category service_category NOT NULL,
    location location_type NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    per_person_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    mca_percentage DECIMAL(5,2) NOT NULL,
    contractor_cap DECIMAL(10,2),
    rent_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    status session_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    contractor_paid_date DATE,
    contractor_paid_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session Attendees (many-to-many between sessions and clients)
CREATE TABLE session_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id),
    individual_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, client_id)
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    amount DECIMAL(10,2) NOT NULL,
    mca_cut DECIMAL(10,2) NOT NULL,
    contractor_pay DECIMAL(10,2) NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Goals table
CREATE TABLE client_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status goal_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON service_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;

-- Users: Everyone can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Clients: All authenticated users can view clients
CREATE POLICY "Authenticated users can view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert clients" ON clients
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update clients" ON clients
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can delete clients" ON clients
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Service Types: All authenticated users can view
CREATE POLICY "Authenticated users can view service types" ON service_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage service types" ON service_types
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Sessions: Contractors see their own, admins see all
CREATE POLICY "Contractors can view own sessions" ON sessions
    FOR SELECT USING (contractor_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON sessions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Contractors can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (contractor_id = auth.uid());

CREATE POLICY "Contractors can update own draft sessions" ON sessions
    FOR UPDATE USING (
        contractor_id = auth.uid() AND status = 'draft'
    );

CREATE POLICY "Admins can update all sessions" ON sessions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Session Attendees: Same as sessions
CREATE POLICY "View attendees for accessible sessions" ON session_attendees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id
            AND (s.contractor_id = auth.uid() OR EXISTS (
                SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
            ))
        )
    );

CREATE POLICY "Insert attendees for own sessions" ON session_attendees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.contractor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage attendees" ON session_attendees
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Invoices: Admins only
CREATE POLICY "Admins can view invoices" ON invoices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Contractors can view invoices for their sessions" ON invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.id = session_id AND s.contractor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage invoices" ON invoices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Client Goals: Same as clients
CREATE POLICY "Authenticated users can view goals" ON client_goals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage goals" ON client_goals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Seed default service types
INSERT INTO service_types (name, category, location, base_rate, per_person_rate, mca_percentage, contractor_cap, rent_percentage) VALUES
    ('In-Home Individual Music', 'music_individual', 'in_home', 50.00, 0, 23.00, NULL, 0),
    ('In-Home Group Music', 'music_group', 'in_home', 50.00, 20.00, 30.00, 105.00, 0),
    ('Matt''s Music Individual', 'music_individual', 'matts_music', 55.00, 0, 30.00, NULL, 10.00),
    ('Matt''s Music Group', 'music_group', 'matts_music', 50.00, 20.00, 30.00, NULL, 0),
    ('Individual Art Lesson', 'art_individual', 'in_home', 40.00, 0, 20.00, NULL, 0),
    ('Group Art Lesson', 'art_group', 'in_home', 40.00, 15.00, 30.00, NULL, 0);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'contractor')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
