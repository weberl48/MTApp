-- Add audit triggers to tables that were missing them
-- Tables: contractor_rates, client_goals, user_invites
-- These use the existing audit_trigger_function() which sanitizes PHI fields

-- Also add 'invited_email' and 'token' to PHI fields for user_invites audit sanitization
CREATE OR REPLACE FUNCTION get_phi_fields()
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY[
        'notes',
        'client_notes',
        'description',       -- client_goals.description
        'contact_email',
        'contact_phone',
        'invited_email',     -- user_invites.invited_email
        'token'              -- user_invites.token (access tokens are sensitive)
    ];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- contractor_rates: tracks per-contractor pay rates (financial data)
CREATE TRIGGER audit_contractor_rates
    AFTER INSERT OR UPDATE OR DELETE ON contractor_rates
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- client_goals: tracks treatment goals (clinical/sensitive data)
CREATE TRIGGER audit_client_goals
    AFTER INSERT OR UPDATE OR DELETE ON client_goals
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- user_invites: tracks team member invitations (access control)
CREATE TRIGGER audit_user_invites
    AFTER INSERT OR UPDATE OR DELETE ON user_invites
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
