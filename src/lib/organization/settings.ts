import type { OrganizationSettings } from '@/types/database'

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
      classrooms: raw?.custom_lists?.classrooms ?? defaults.custom_lists.classrooms,
    },
    automation: { ...defaults.automation, ...(raw?.automation || {}) },
  }
}
