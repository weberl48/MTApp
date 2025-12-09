-- App Settings table for business configuration
-- This allows the admin to configure app-wide settings without code changes

CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings
CREATE POLICY "Authenticated users can view settings" ON app_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify settings
CREATE POLICY "Admins can manage settings" ON app_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
    ('business_info', '{
        "name": "May Creative Arts",
        "email": "maycreativearts@gmail.com",
        "phone": "",
        "address": "",
        "website": ""
    }', 'Business contact information'),

    ('invoice_settings', '{
        "footer_text": "Thank you for your business!",
        "payment_instructions": "Please make checks payable to May Creative Arts",
        "due_days": 30,
        "send_reminders": true,
        "reminder_days": [7, 1]
    }', 'Invoice configuration'),

    ('session_settings', '{
        "default_duration": 30,
        "duration_options": [30, 45, 60, 90],
        "require_notes": false,
        "auto_submit": false
    }', 'Session form defaults'),

    ('notification_settings', '{
        "email_on_session_submit": true,
        "email_on_invoice_paid": true,
        "admin_email": "maycreativearts@gmail.com"
    }', 'Email notification preferences')
ON CONFLICT (key) DO NOTHING;

-- Add is_active column to service_types for soft delete
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add display_order column to service_types for custom ordering
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Update existing rows to have sequential display_order
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name) as rn
    FROM service_types
)
UPDATE service_types
SET display_order = numbered.rn
FROM numbered
WHERE service_types.id = numbered.id;
