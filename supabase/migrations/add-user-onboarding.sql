-- User onboarding progress tracking
-- Stores per-user completion/progress for onboarding wizards

CREATE TABLE IF NOT EXISTS user_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    wizard_key TEXT NOT NULL,
    step INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, organization_id, wizard_key)
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_org
    ON user_onboarding (user_id, organization_id);

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can manage their own onboarding rows
CREATE POLICY "Users can view their onboarding" ON user_onboarding
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their onboarding" ON user_onboarding
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their onboarding" ON user_onboarding
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their onboarding" ON user_onboarding
    FOR DELETE
    USING (auth.uid() = user_id);

-- Keep updated_at current
CREATE TRIGGER update_user_onboarding_updated_at
    BEFORE UPDATE ON user_onboarding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
