-- Add branding and customization fields to organizations
-- =====================================================

-- Add branding columns to organizations if they don't exist
DO $$
BEGIN
    -- Primary brand color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'primary_color') THEN
        ALTER TABLE organizations ADD COLUMN primary_color TEXT DEFAULT '#3b82f6';
    END IF;

    -- Secondary brand color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'secondary_color') THEN
        ALTER TABLE organizations ADD COLUMN secondary_color TEXT DEFAULT '#1e40af';
    END IF;

    -- Business tagline
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'tagline') THEN
        ALTER TABLE organizations ADD COLUMN tagline TEXT;
    END IF;

    -- Business description (for invoices, emails)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'description') THEN
        ALTER TABLE organizations ADD COLUMN description TEXT;
    END IF;

    -- Tax ID / EIN (for invoices)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'tax_id') THEN
        ALTER TABLE organizations ADD COLUMN tax_id TEXT;
    END IF;

    -- Social media links (JSONB for flexibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'social_links') THEN
        ALTER TABLE organizations ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Business hours (JSONB for flexibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'business_hours') THEN
        ALTER TABLE organizations ADD COLUMN business_hours JSONB DEFAULT '{
            "monday": {"open": "09:00", "close": "17:00", "closed": false},
            "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
            "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
            "thursday": {"open": "09:00", "close": "17:00", "closed": false},
            "friday": {"open": "09:00", "close": "17:00", "closed": false},
            "saturday": {"open": "09:00", "close": "12:00", "closed": true},
            "sunday": {"open": "09:00", "close": "12:00", "closed": true}
        }'::jsonb;
    END IF;

    -- Timezone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'timezone') THEN
        ALTER TABLE organizations ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
    END IF;

    -- Currency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'currency') THEN
        ALTER TABLE organizations ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
END $$;

-- Create storage bucket for organization assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'organization-assets',
    'organization-assets',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Storage policies for organization assets

-- Allow authenticated users to view any organization's public assets
DROP POLICY IF EXISTS "Organization assets are publicly accessible" ON storage.objects;
CREATE POLICY "Organization assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-assets');

-- Allow users to upload assets for their own organization
DROP POLICY IF EXISTS "Users can upload assets for their organization" ON storage.objects;
CREATE POLICY "Users can upload assets for their organization"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text FROM public.users WHERE id = auth.uid()
    )
);

-- Allow users to update assets for their own organization
DROP POLICY IF EXISTS "Users can update assets for their organization" ON storage.objects;
CREATE POLICY "Users can update assets for their organization"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text FROM public.users WHERE id = auth.uid()
    )
);

-- Allow users to delete assets for their own organization
DROP POLICY IF EXISTS "Users can delete assets for their organization" ON storage.objects;
CREATE POLICY "Users can delete assets for their organization"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (
        SELECT organization_id::text FROM public.users WHERE id = auth.uid()
    )
);

-- Add comment for documentation
COMMENT ON COLUMN organizations.primary_color IS 'Primary brand color in hex format';
COMMENT ON COLUMN organizations.secondary_color IS 'Secondary brand color in hex format';
COMMENT ON COLUMN organizations.social_links IS 'Social media links: {facebook, instagram, twitter, linkedin, youtube}';
COMMENT ON COLUMN organizations.business_hours IS 'Business hours per day: {dayName: {open, close, closed}}';
