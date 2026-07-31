/**
 * Role targeting for guided tours.
 *
 * A walkthrough (or a single step) can declare an `audience`; anything without
 * one is for everyone. The flags mirror how the app itself gates the UI the
 * tours point at: admin/owner via `can()` (effective role, so View As works),
 * contractor via the effective contractor check the Earnings page uses.
 */

export type WalkthroughAudience = 'admin' | 'owner' | 'contractor'

export type AudienceFlags = {
  /** `can('session:view-all')` — admin, owner, developer */
  isAdmin: boolean
  /** `can('settings:edit')` — owner, developer */
  isOwner: boolean
  /** Effective role is contractor (including View As a contractor) */
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
