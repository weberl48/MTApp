import type { UserRole } from '@/types/database'

/**
 * Whether a user may create a team invite targeting a given organization.
 *
 * Developers and owners have intentional cross-organization access, so they may invite
 * into any org. Everyone else (notably admins, who can create contractor invites) may
 * only target their OWN organization. A prior bug took organizationId from the request
 * body and never compared it to the caller's org, letting an admin of org A mint a valid
 * invite into org B (a cross-tenant foothold).
 */
export function canTargetOrgForInvite(
  role: UserRole | null | undefined,
  callerOrganizationId: string | null | undefined,
  targetOrganizationId: string
): boolean {
  if (role === 'developer' || role === 'owner') return true
  return !!callerOrganizationId && targetOrganizationId === callerOrganizationId
}
