'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, User, OrganizationSettings } from '@/types/database'

interface OrganizationContextType {
  organization: Organization | null
  user: User | null
  settings: OrganizationSettings | null
  loading: boolean
  error: string | null
  isDeveloper: boolean
  isOwner: boolean
  isAdmin: boolean
  allOrganizations: Organization[]
  switchOrganization: (orgId: string) => Promise<void>
  refreshOrganization: () => Promise<void>
  updateOrganization: (updates: Partial<Organization>) => Promise<void>
  updateSettings: (settings: OrganizationSettings) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

// Default settings for new organizations
const DEFAULT_SETTINGS: OrganizationSettings = {
  invoice: {
    footer_text: 'Thank you for your business!',
    payment_instructions: '',
    due_days: 30,
    send_reminders: true,
    reminder_days: [7, 1],
  },
  session: {
    default_duration: 30,
    duration_options: [30, 45, 60, 90],
    require_notes: false,
    auto_submit: false,
    reminder_hours: 24,
    send_reminders: true,
  },
  notification: {
    email_on_session_submit: true,
    email_on_invoice_paid: true,
    admin_email: '',
  },
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)

  const isDeveloper = user?.role === 'developer'
  const isOwner = user?.role === 'owner' || user?.role === 'developer'
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || user?.role === 'developer'

  // Parse settings with defaults (deep merge)
  const settings: OrganizationSettings | null = organization
    ? {
        invoice: {
          ...DEFAULT_SETTINGS.invoice,
          ...((organization.settings as OrganizationSettings)?.invoice || {}),
        },
        session: {
          ...DEFAULT_SETTINGS.session,
          ...((organization.settings as OrganizationSettings)?.session || {}),
        },
        notification: {
          ...DEFAULT_SETTINGS.notification,
          ...((organization.settings as OrganizationSettings)?.notification || {}),
        },
      }
    : null

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

      // If developer, load all organizations for switching
      if (userProfile.role === 'developer') {
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
    } catch (err) {
      console.error('Error loading organization:', err)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
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
        allOrganizations,
        switchOrganization,
        refreshOrganization,
        updateOrganization,
        updateSettings,
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
