import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrganizationSettings } from '@/types/database'
import { adminGrantsFromSettings, mergeOrganizationSettings } from '@/lib/organization/settings'
import type { AdminGrants } from '@/lib/auth/permissions'

/**
 * Read an organization's admin grants (Settings > Profile & Security) for a
 * permission check that can't use OrganizationContext — server components, API
 * routes, and client pages whose authorization runs inside their own fetch
 * effect, where a still-loading context would deny a granted admin.
 *
 * Fails CLOSED: no org id, a failed read, or absent settings all yield no
 * grants, leaving the plain role check in charge.
 */
export async function fetchAdminGrants(
  supabase: SupabaseClient,
  organizationId: string | null | undefined
): Promise<AdminGrants> {
  if (!organizationId) return {}
  const { data, error } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single<{ settings: OrganizationSettings | null }>()
  if (error || !data) return {}
  return adminGrantsFromSettings(mergeOrganizationSettings(data.settings))
}
