'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { can } from '@/lib/auth/permissions'
import { applySettingsUpdate } from '@/lib/organization/settings'
import { logger } from '@/lib/logger'
import type { OrganizationSettings, UserRole } from '@/types/database'

/**
 * Persist organization settings.
 *
 * Settings writes MUST go through this action: `organizations` RLS is owner/developer-only,
 * and the whole settings blob lives in one JSONB column, so RLS cannot express "an admin may
 * change invoice defaults but not `security.require_mfa`". The section allow-list in
 * `applySettingsUpdate()` is that boundary, applied here before a service-client write.
 *
 * Previously the browser wrote `organizations.settings` directly under a policy that included
 * admins, so an admin could disable MFA enforcement or flip owner-only feature flags with a
 * single client-side call, regardless of which tabs the UI rendered for them.
 */
export async function updateOrganizationSettings(
  organizationId: string,
  settings: OrganizationSettings
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false as const, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single<{ role: string; organization_id: string }>()

  const role = (profile?.role as UserRole | undefined) ?? null

  // Admin is the floor for touching settings at all; which sections land is decided below.
  if (!can(role, 'session:view-all')) {
    return { success: false as const, error: 'Permission denied' }
  }

  // Same cross-org rule as canTargetOrgForInvite() in src/lib/auth/invite-scope.ts:
  // developers and owners are intentionally cross-org, everyone else is pinned to their own.
  const crossOrgAllowed = role === 'developer' || role === 'owner'
  if (!crossOrgAllowed && organizationId !== profile?.organization_id) {
    return { success: false as const, error: 'Permission denied' }
  }

  const service = createServiceClient()

  const { data: current, error: readError } = await service
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single<{ settings: OrganizationSettings | null }>()

  if (readError || !current) {
    logger.error('Failed to read organization settings', readError)
    return { success: false as const, error: 'Organization not found' }
  }

  const merged = applySettingsUpdate(current.settings, settings, can(role, 'settings:edit'))

  const { error: writeError } = await service
    .from('organizations')
    .update({ settings: merged })
    .eq('id', organizationId)

  if (writeError) {
    logger.error('Failed to update organization settings', writeError)
    return { success: false as const, error: 'Failed to update settings' }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')

  return { success: true as const, settings: merged }
}
