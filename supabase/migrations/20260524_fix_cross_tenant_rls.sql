-- Migration: Fix cross-tenant data leaks in RLS policies
--
-- Two bugs found while testing a sandbox-org user:
--
-- 1. public.users had a stray "Authenticated users can view all users" policy
--    with USING (true). Combined with "Users can view users in same org", this
--    made the users table readable across every organization.
--
-- 2. public.contractor_rates "Admins can manage contractor rates" allowed any
--    admin / owner / developer to see and mutate every contractor_rate in the
--    system, not just rates belonging to their own organization. The table has
--    no organization_id column, so the policy now joins through users
--    (contractor_id -> users.organization_id) to scope by tenant.

-- ==============================================================================
-- USERS: remove the open SELECT policy
-- ==============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

-- ==============================================================================
-- CONTRACTOR_RATES: scope admin policy by organization
-- ==============================================================================

DROP POLICY IF EXISTS "Admins can manage contractor rates" ON public.contractor_rates;

CREATE POLICY "Admins can manage contractor rates" ON public.contractor_rates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.users caller
            JOIN public.users contractor ON contractor.id = contractor_rates.contractor_id
            WHERE caller.id = (select auth.uid())
              AND caller.role IN ('developer', 'owner', 'admin')
              AND (
                  caller.role = 'developer'
                  OR caller.organization_id = contractor.organization_id
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users caller
            JOIN public.users contractor ON contractor.id = contractor_rates.contractor_id
            WHERE caller.id = (select auth.uid())
              AND caller.role IN ('developer', 'owner', 'admin')
              AND (
                  caller.role = 'developer'
                  OR caller.organization_id = contractor.organization_id
              )
        )
    );
