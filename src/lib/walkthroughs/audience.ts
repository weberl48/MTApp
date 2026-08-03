/**
 * Role targeting for guided tours.
 *
 * A walkthrough (or a single step) can declare an `audience`; anything without
 * one is for everyone. The flags mirror how the app itself gates the UI the
 * tours point at — all from the EFFECTIVE role, so View As works: admin/owner
 * via `can()`, contractor via `OrganizationContext`'s `isContractor`, the same
 * value the sidebar uses to render the contractor-only nav a tour highlights.
 */

export type WalkthroughAudience = 'admin' | 'owner' | 'contractor'

export type AudienceFlags = {
  /** `can('session:view-all')` — admin, owner, developer */
  isAdmin: boolean
  /** `can('settings:edit')` — owner, developer */
  isOwner: boolean
  /** `OrganizationContext.isContractor` — effective role, including View As */
  isContractor: boolean
}

export function audienceAllows(
  audience: WalkthroughAudience | undefined,
  flags: AudienceFlags
): boolean {
  if (!audience) return true
  if (audience === 'admin') return flags.isAdmin
  if (audience === 'owner') return flags.isOwner
  return flags.isContractor
}

/**
 * The steps of a tour this user should actually see. Lets one tour serve
 * several roles (e.g. the App Overview skips admin-only nav for contractors
 * and shows the Earnings stop only to them) instead of falling back to a
 * centered popover describing UI the user doesn't have.
 */
export function visibleWalkthroughSteps<T extends { audience?: WalkthroughAudience }>(
  steps: T[],
  flags: AudienceFlags
): T[] {
  return steps.filter((s) => audienceAllows(s.audience, flags))
}
