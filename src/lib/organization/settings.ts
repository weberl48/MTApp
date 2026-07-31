import { DEFAULT_LOCATION_LABEL } from '@/types/database'
import type { ClientLocationConfig, OrganizationSettings } from '@/types/database'

// Default settings for new organizations. Organizations without a given field automatically
// get these values via the deep merge below.
export const DEFAULT_SETTINGS: OrganizationSettings = {
  invoice: {
    footer_text: 'Thank you for your business!',
    payment_instructions: '',
    due_days: 30,
    send_reminders: true,
    reminder_days: [7, 1],
    show_session_location: false,
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
    classrooms: [],
    classrooms_by_client: {},
    locations_by_client: {},
  },
  automation: {
    auto_approve_sessions: false,
    auto_send_invoice_on_approve: false,
    auto_send_invoice_method: 'none',
    auto_generate_scholarship_invoices: false,
    scholarship_invoice_day: 1,
  },
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
/**
 * Upgrade legacy `classrooms_by_client` string lists into full location configs.
 *
 * The legacy map only ever expressed a required, fixed picklist, so that is
 * exactly what it becomes. Explicit `locations_by_client` entries win for the
 * same client. Pure — nothing is written back to the database.
 */
function mergeLocationConfigs(
  legacy: Record<string, string[]> | undefined,
  explicit: Record<string, ClientLocationConfig> | undefined
): Record<string, ClientLocationConfig> {
  const out: Record<string, ClientLocationConfig> = {}
  for (const [clientId, options] of Object.entries(legacy || {})) {
    out[clientId] = {
      label: DEFAULT_LOCATION_LABEL,
      options: options ?? [],
      allow_other: false,
      required: true,
    }
  }
  for (const [clientId, cfg] of Object.entries(explicit || {})) {
    out[clientId] = {
      label: cfg?.label || DEFAULT_LOCATION_LABEL,
      options: cfg?.options ?? [],
      allow_other: cfg?.allow_other ?? false,
      required: cfg?.required ?? true,
    }
  }
  return out
}

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
      classrooms: raw?.custom_lists?.classrooms ?? defaults.custom_lists.classrooms,
      classrooms_by_client: raw?.custom_lists?.classrooms_by_client ?? defaults.custom_lists.classrooms_by_client,
      locations_by_client: mergeLocationConfigs(
        raw?.custom_lists?.classrooms_by_client,
        raw?.custom_lists?.locations_by_client
      ),
    },
    automation: { ...defaults.automation, ...(raw?.automation || {}) },
  }
}
