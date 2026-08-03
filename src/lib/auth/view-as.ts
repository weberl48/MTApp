import type { UserRole } from '@/types/database'

/**
 * "View As" role simulation, readable on the server.
 *
 * The switcher used to be React state only, which had two consequences:
 *
 *  1. **Server components could not see it at all.** `/team` is a server
 *     component, so it computed `team:view-rates` from the real database role
 *     and rendered the Rates tab, the Pending Contractor Pay card and every
 *     contractor's earnings while the header said "As Admin". The preview was
 *     lying about the single most sensitive thing it is meant to hide.
 *  2. It reset on every full navigation, because a hard load remounts the app.
 *
 * Mirroring the selection into a cookie fixes both: any server component can
 * read it, and it survives navigation.
 *
 * SECURITY: the cookie is written by the browser and must never be trusted on
 * its own. The server always re-reads the real role from the database and passes
 * it here; `resolveEffectiveRole` only ever returns a role the real one already
 * entitles the user to. An admin who hand-crafts `mca_view_as=owner` gets
 * nothing. This is UI gating regardless — RLS remains the real boundary.
 */
export const VIEW_AS_COOKIE = 'mca_view_as'

const SIMULATABLE: UserRole[] = ['owner', 'admin', 'contractor']

/**
 * Only developers and owners may simulate — matching `actualIsDeveloper` in
 * OrganizationContext, so the client and server agree on who gets the switcher.
 */
function maySimulate(actualRole: UserRole | null): boolean {
  return actualRole === 'developer' || actualRole === 'owner'
}

/**
 * The role the UI should be gated on.
 *
 * @param actualRole   the role read from the database, never from the client
 * @param requested    raw cookie value; anything unrecognised is ignored
 */
export function resolveEffectiveRole(
  actualRole: UserRole | null,
  requested: string | null | undefined
): UserRole | null {
  if (!actualRole) return null
  if (!requested || !maySimulate(actualRole)) return actualRole
  if (!SIMULATABLE.includes(requested as UserRole)) return actualRole

  // An owner simulating "owner" is a no-op; an owner can still only step DOWN
  // to admin/contractor. Developer is deliberately absent from SIMULATABLE, so
  // an owner can never use this to become one.
  return requested as UserRole
}
