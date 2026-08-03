'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, User, UserRole, OrganizationSettings, FeatureFlags } from '@/types/database'
import { canWithGrants, type Permission } from '@/lib/auth/permissions'
import { VIEW_AS_COOKIE } from '@/lib/auth/view-as'
import { adminGrantsFromSettings, mergeOrganizationSettings } from '@/lib/organization/settings'
import { updateOrganizationSettings } from '@/app/actions/organization'

type ViewAsRole = 'contractor' | 'admin' | 'owner' | null

interface ViewAsContractor {
  id: string
  name: string
  email: string
}

interface OrganizationContextType {
  organization: Organization | null
  user: User | null
  settings: OrganizationSettings | null
  loading: boolean
  error: string | null
  isDeveloper: boolean
  isOwner: boolean
  isAdmin: boolean
  isContractor: boolean // Effective role is contractor (so "View As" previews match a real contractor)
  actualRole: string | null // The user's real role (for developers to know their actual permissions)
  viewAsRole: ViewAsRole // The role being simulated (null = use actual role)
  setViewAsRole: (role: ViewAsRole) => void
  viewAsContractor: ViewAsContractor | null // Specific contractor being simulated
  setViewAsContractor: (contractor: ViewAsContractor | null) => void
  effectiveUserId: string | null // The user ID to use for data queries (actual or simulated)
  allOrganizations: Organization[]
  switchOrganization: (orgId: string) => Promise<void>
  refreshOrganization: () => Promise<void>
  updateOrganization: (updates: Partial<Organization>) => Promise<void>
  updateSettings: (settings: OrganizationSettings) => Promise<void>
  can: (permission: Permission) => boolean
  feature: (flag: keyof FeatureFlags) => boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [viewAsRole, setViewAsRoleState] = useState<ViewAsRole>(null)
  const [viewAsContractor, setViewAsContractor] = useState<ViewAsContractor | null>(null)

  /**
   * Mirror the simulated role into a cookie so SERVER components can honour it.
   *
   * Client components read `can()` from this context and were always correct.
   * Server-rendered pages (notably /team) had no way to know the switcher was
   * set, so they gated on the real database role and happily rendered contractor
   * pay rates and earnings while the header said "As Admin". The cookie is
   * re-validated server-side against the real role (see lib/auth/view-as.ts), so
   * it cannot be used to escalate — it only ever narrows what is shown.
   *
   * Not httpOnly: the browser has to write it. It is not a credential.
   */
  const setViewAsRole = useCallback((role: ViewAsRole) => {
    setViewAsRoleState(role)
    if (typeof document === 'undefined') return
    document.cookie = role
      ? `${VIEW_AS_COOKIE}=${role}; path=/; SameSite=Lax; max-age=86400`
      : `${VIEW_AS_COOKIE}=; path=/; SameSite=Lax; max-age=0`
  }, [])

  // A hard navigation remounts this provider, so re-adopt whatever the cookie
  // says; otherwise the switcher silently snapped back to the real role on every
  // full page load and the preview quietly stopped applying.
  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${VIEW_AS_COOKIE}=([^;]*)`))
    const stored = match?.[1]
    if (stored === 'owner' || stored === 'admin' || stored === 'contractor') {
      setViewAsRoleState(stored)
    }
  }, [])

  // Actual role from the database
  const actualRole = user?.role || null
  // Owner has same permissions as developer
  const actualIsDeveloper = actualRole === 'developer' || actualRole === 'owner'

  // Effective role (respects viewAsRole for developers/owners)
  const effectiveRole = actualIsDeveloper && viewAsRole ? viewAsRole : actualRole

  // Role checks based on effective role (allows developers to simulate other roles)
  // Owner has the same permissions as developer
  const isDeveloper = effectiveRole === 'developer' || effectiveRole === 'owner'
  const isOwner = effectiveRole === 'owner' || effectiveRole === 'developer'
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'owner' || effectiveRole === 'developer'
  // Contractor-only UI (the Earnings nav link, the quick-log FAB) keys off this rather than
  // `user.role`, so an owner using "View As" sees the same surfaces the contractor does —
  // otherwise the contractor tours point at nav links the preview never renders.
  const isContractor = effectiveRole === 'contractor' || (actualIsDeveloper && !!viewAsContractor)

  // Effective user ID for data queries (use simulated contractor if set, otherwise actual user)
  const effectiveUserId = viewAsContractor?.id || user?.id || null

  // Parse settings with defaults (deep merge). Memoized on `organization` so a re-render that
  // doesn't change the organization keeps a STABLE settings identity. Settings forms mirror
  // this value into local state via useEffect; an unstable identity (a fresh object every
  // render) re-fired those effects and wiped the user's unsaved edits.
  const settings: OrganizationSettings | null = useMemo(
    () => (organization ? mergeOrganizationSettings(organization.settings as OrganizationSettings) : null),
    [organization]
  )

  // What this organization's owner has opted admins into seeing. Memoized on
  // `settings` so `can` keeps a stable identity between renders.
  const adminGrants = useMemo(() => adminGrantsFromSettings(settings), [settings])

  const loadOrganization = useCallback(async (targetOrgId?: string) => {
    const supabase = createClient()

    try {
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setOrganization(null)
        setUser(null)
        setLoading(false)
        return
      }

      // Get user profile with organization_id
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError || !userProfile) {
        setError('Failed to load user profile')
        setLoading(false)
        return
      }

      setUser(userProfile)

      // If developer or owner, load all organizations for switching
      if (userProfile.role === 'developer' || userProfile.role === 'owner') {
        const { data: allOrgs } = await supabase
          .from('organizations')
          .select('*')
          .order('name')

        setAllOrganizations(allOrgs || [])

        // Use target org if specified, otherwise use active or user's default
        const orgIdToLoad = targetOrgId || activeOrgId || userProfile.organization_id

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgIdToLoad)
          .single()

        if (orgError || !org) {
          // Fallback to user's org if target not found
          const { data: fallbackOrg } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userProfile.organization_id)
            .single()

          setOrganization(fallbackOrg)
        } else {
          setOrganization(org)
          setActiveOrgId(org.id)
        }
      } else {
        // Regular users only see their own org
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userProfile.organization_id)
          .single()

        if (orgError || !org) {
          setError('Failed to load organization')
          setLoading(false)
          return
        }

        setOrganization(org)
        setAllOrganizations([org])
      }

      setError(null)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [activeOrgId])

  const refreshOrganization = useCallback(async () => {
    setLoading(true)
    await loadOrganization()
  }, [loadOrganization])

  const switchOrganization = useCallback(async (orgId: string) => {
    if (!isDeveloper) {
      console.warn('Only developers can switch organizations')
      return
    }
    setLoading(true)
    setActiveOrgId(orgId)
    await loadOrganization(orgId)
  }, [isDeveloper, loadOrganization])

  const updateOrganization = useCallback(async (updates: Partial<Organization>) => {
    if (!organization) return

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organization.id)

    if (updateError) {
      throw new Error('Failed to update organization')
    }

    // Refresh to get updated data
    await refreshOrganization()
  }, [organization, refreshOrganization])

  const updateSettings = useCallback(async (newSettings: OrganizationSettings) => {
    if (!organization) return

    // Goes through a server action, not the browser client: `organizations` RLS is
    // owner-only, and the action decides which sections a non-owner may actually move.
    const result = await updateOrganizationSettings(organization.id, newSettings)

    if (!result.success) {
      throw new Error(result.error)
    }

    // Mirror what was actually persisted — a non-owner's denied sections come back unchanged.
    setOrganization(prev => prev ? { ...prev, settings: result.settings } : null)
  }, [organization])

  useEffect(() => {
    loadOrganization()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Don't reload the whole org/user on routine token refreshes (fired ~hourly and on tab
      // refocus). It churns context state and wiped unsaved edits in settings forms. Reload
      // only on real identity changes (sign in/out, user update).
      if (event === 'TOKEN_REFRESHED') return
      loadOrganization()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadOrganization])

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        user,
        settings,
        loading,
        error,
        isDeveloper,
        isOwner,
        isAdmin,
        isContractor,
        actualRole,
        viewAsRole,
        setViewAsRole,
        viewAsContractor,
        setViewAsContractor,
        effectiveUserId,
        allOrganizations,
        switchOrganization,
        refreshOrganization,
        updateOrganization,
        updateSettings,
        can: (permission: Permission) =>
          canWithGrants(effectiveRole as UserRole, permission, adminGrants),
        feature: (flag: keyof FeatureFlags) => settings?.features?.[flag] ?? true,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
