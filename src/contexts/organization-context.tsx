'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, User, UserRole, OrganizationSettings, FeatureFlags } from '@/types/database'
import { can, type Permission } from '@/lib/auth/permissions'
import { mergeOrganizationSettings } from '@/lib/organization/settings'

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
  const [viewAsRole, setViewAsRole] = useState<ViewAsRole>(null)
  const [viewAsContractor, setViewAsContractor] = useState<ViewAsContractor | null>(null)

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

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: newSettings })
      .eq('id', organization.id)

    if (updateError) {
      throw new Error('Failed to update settings')
    }

    // Update local state
    setOrganization(prev => prev ? { ...prev, settings: newSettings } : null)
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
        can: (permission: Permission) => can(effectiveRole as UserRole, permission),
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
