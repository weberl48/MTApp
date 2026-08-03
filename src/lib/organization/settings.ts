import type { OrganizationSettings } from '@/types/database'
import type { AdminGrantablePermission, AdminGrants } from '@/lib/auth/permissions'

// Default settings for new organizations. Organizations without a given field automatically
// get these values via the deep merge below.
export const DEFAULT_SETTINGS: OrganizationSettings = {
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
  security: {
    session_timeout_minutes: 30,
    require_mfa: false,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
  },
  pricing: {
    no_show_fee: 60,
    duration_base_minutes: 30,
    square_processing_fee_enabled: false,
    square_processing_fee_type: 'fixed' as const,
    square_processing_fee_amount: 0,
    square_processing_fee_percentage: 0,
    square_processing_fee_fixed_cents: 0,
  },
  portal: {
    token_expiry_days: 90,
  },
  features: {
    client_portal: true,
    ai_help: true,
  },
  custom_lists: {
    payment_methods: {
      private_pay: { label: 'Private Pay', visible: true },
      self_directed: { label: 'Self-Directed', visible: true },
      group_home: { label: 'Group Home', visible: true },
      scholarship: { label: 'Scholarship', visible: true },
      venmo: { label: 'Venmo', visible: true },
    },
    billing_methods: {
      square: { label: 'Square', visible: true },
      check: { label: 'Check', visible: true },
      email: { label: 'Email', visible: true },
      other: { label: 'Other', visible: true },
    },
  },
  automation: {
    auto_approve_sessions: false,
    auto_send_invoice_on_approve: false,
    auto_send_invoice_method: 'none',
    auto_generate_scholarship_invoices: false,
    scholarship_invoice_day: 1,
  },
  // Admins see no money until the owner opts in.
  permissions: {
    admin_view_contractor_pay: false,
    admin_view_margins: false,
    admin_view_analytics: false,
    admin_view_payroll: false,
  },
}

/**
 * `settings.permissions` flag -> the permission it grants an admin. The single
 * place the two representations meet; `adminGrantsFromSettings()` below is the
 * only way to turn stored settings into grants, so a renamed flag breaks loudly
 * here instead of silently granting nothing.
 */
const ADMIN_GRANT_BY_SETTING = {
  admin_view_contractor_pay: 'team:view-rates',
  admin_view_margins: 'financial:view-details',
  admin_view_analytics: 'analytics:view',
  admin_view_payroll: 'payments:view',
} as const satisfies Record<keyof OrganizationSettings['permissions'], AdminGrantablePermission>

/** The admin grants this organization has turned on. Safe on partial/legacy settings. */
export function adminGrantsFromSettings(
  settings: OrganizationSettings | null | undefined
): AdminGrants {
  const grants: AdminGrants = {}
  const flags = settings?.permissions
  if (!flags) return grants
  for (const [flag, permission] of Object.entries(ADMIN_GRANT_BY_SETTING)) {
    if (flags[flag as keyof typeof flags] === true) grants[permission] = true
  }
  return grants
}

/**
 * Settings sections an admin may write. Everything absent from this list is owner business:
 * `security` (MFA enforcement, lockout thresholds), `portal` (token expiry), `features`
 * (feature flags) and `automation` — none of which admins can reach in the UI.
 *
 * `pricing` IS listed: the admin-visible Business Rules tabs edit the no-show fee, duration
 * base and the Square processing fee, so denying it would break a capability admins already
 * have. Narrow it here (and hide those inputs) if that should change.
 */
export const ADMIN_WRITABLE_SETTING_SECTIONS = [
  'invoice',
  'session',
  'notification',
  'custom_lists',
  'pricing',
] as const satisfies readonly (keyof OrganizationSettings)[]

/**
 * Build the settings object to persist. Callers who can edit everything (`settings:edit` —
 * owner/developer) write `incoming` as-is; everyone else may only move the sections above,
 * with the stored values kept for the rest.
 *
 * This is the whole authorization boundary for settings writes: `organizations` RLS is
 * owner-only, so admin edits go through the server action that calls this.
 */
export function applySettingsUpdate(
  stored: OrganizationSettings | null | undefined,
  incoming: OrganizationSettings,
  canEditAllSections: boolean
): OrganizationSettings {
  if (canEditAllSections) return incoming

  const merged = mergeOrganizationSettings(stored)
  for (const section of ADMIN_WRITABLE_SETTING_SECTIONS) {
    if (incoming[section] === undefined) continue
    // Each section is replaced wholesale, matching how the settings forms submit them.
    merged[section] = incoming[section] as never
  }
  return merged
}

/**
 * Deep-merge a (possibly partial / null) raw settings JSONB onto the defaults so every section
 * and field has a value. Sections are shallow-spread; `custom_lists` is merged one level deeper.
 *
 * Keeping this pure (and memoizing the call site) gives a stable settings identity across
 * re-renders that don't change the organization — settings forms mirror this value into local
 * state via useEffect, and an unstable identity wiped their unsaved edits on every render.
 */
export function mergeOrganizationSettings(
  raw: OrganizationSettings | null | undefined,
  defaults: OrganizationSettings = DEFAULT_SETTINGS
): OrganizationSettings {
  return {
    invoice: { ...defaults.invoice, ...(raw?.invoice || {}) },
    session: { ...defaults.session, ...(raw?.session || {}) },
    notification: { ...defaults.notification, ...(raw?.notification || {}) },
    security: { ...defaults.security, ...(raw?.security || {}) },
    pricing: { ...defaults.pricing, ...(raw?.pricing || {}) },
    portal: { ...defaults.portal, ...(raw?.portal || {}) },
    features: { ...defaults.features, ...(raw?.features || {}) },
    custom_lists: {
      payment_methods: {
        ...defaults.custom_lists.payment_methods,
        ...(raw?.custom_lists?.payment_methods || {}),
      },
      billing_methods: {
        ...defaults.custom_lists.billing_methods,
        ...(raw?.custom_lists?.billing_methods || {}),
      },
    },
    automation: { ...defaults.automation, ...(raw?.automation || {}) },
    permissions: { ...defaults.permissions, ...(raw?.permissions || {}) },
  }
}
