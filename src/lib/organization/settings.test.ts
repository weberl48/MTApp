/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import {
  ADMIN_WRITABLE_SETTING_SECTIONS,
  DEFAULT_SETTINGS,
  applySettingsUpdate,
  mergeOrganizationSettings,
} from './settings'

describe('mergeOrganizationSettings (regression for #20 — settings defaults/merge)', () => {
  it('returns defaults for null/undefined raw settings', () => {
    expect(mergeOrganizationSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(mergeOrganizationSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  })

  it('overrides only the provided fields, keeping other defaults', () => {
    const merged = mergeOrganizationSettings({ pricing: { no_show_fee: 75 } } as any)
    expect(merged.pricing.no_show_fee).toBe(75)
    expect(merged.pricing.duration_base_minutes).toBe(DEFAULT_SETTINGS.pricing.duration_base_minutes)
    expect(merged.invoice.due_days).toBe(DEFAULT_SETTINGS.invoice.due_days)
  })

  it('merges custom_lists one level deeper', () => {
    const merged = mergeOrganizationSettings({
      custom_lists: { payment_methods: { venmo: { label: 'Venmo Pay', visible: false } } },
    } as any)
    expect(merged.custom_lists.payment_methods.venmo).toEqual({ label: 'Venmo Pay', visible: false })
    // other payment + billing methods retained from defaults
    expect(merged.custom_lists.payment_methods.private_pay).toEqual(
      DEFAULT_SETTINGS.custom_lists.payment_methods.private_pay
    )
    expect(merged.custom_lists.billing_methods.square).toEqual(
      DEFAULT_SETTINGS.custom_lists.billing_methods.square
    )
  })

  it('does not mutate the defaults', () => {
    mergeOrganizationSettings({ pricing: { no_show_fee: 999 } } as any)
    expect(DEFAULT_SETTINGS.pricing.no_show_fee).toBe(60)
  })
})

describe('applySettingsUpdate (settings write authorization boundary)', () => {
  const stored = mergeOrganizationSettings({
    security: { require_mfa: true, max_login_attempts: 3 },
    features: { client_portal: true, ai_help: true },
    invoice: { due_days: 30 },
  } as any)

  it('writes everything for a caller who can edit all sections', () => {
    const incoming = mergeOrganizationSettings({ security: { require_mfa: false } } as any)
    expect(applySettingsUpdate(stored, incoming, true)).toBe(incoming)
  })

  it('keeps owner-only sections when the caller cannot edit them', () => {
    const incoming = mergeOrganizationSettings({
      security: { require_mfa: false, max_login_attempts: 99 },
      features: { client_portal: false, ai_help: false },
      portal: { token_expiry_days: 3650 },
      automation: { auto_approve_sessions: true },
      invoice: { due_days: 14 },
    } as any)

    const result = applySettingsUpdate(stored, incoming, false)

    // Denied sections keep their stored values...
    expect(result.security.require_mfa).toBe(true)
    expect(result.security.max_login_attempts).toBe(3)
    expect(result.features.client_portal).toBe(true)
    expect(result.portal.token_expiry_days).toBe(stored.portal.token_expiry_days)
    expect(result.automation.auto_approve_sessions).toBe(false)
    // ...while an allowed section still lands.
    expect(result.invoice.due_days).toBe(14)
  })

  it('lets an admin move every section on the allow-list', () => {
    const incoming = mergeOrganizationSettings({
      invoice: { due_days: 7 },
      session: { default_duration: 45 },
      notification: { admin_email: 'ops@example.com' },
      custom_lists: { payment_methods: { venmo: { label: 'V-Pay', visible: false } } },
      pricing: { no_show_fee: 75 },
    } as any)

    const result = applySettingsUpdate(stored, incoming, false)

    expect(result.invoice.due_days).toBe(7)
    expect(result.session.default_duration).toBe(45)
    expect(result.notification.admin_email).toBe('ops@example.com')
    expect(result.custom_lists.payment_methods.venmo).toEqual({ label: 'V-Pay', visible: false })
    expect(result.pricing.no_show_fee).toBe(75)
  })

  it('never lists a privileged section as admin-writable', () => {
    for (const section of ['security', 'features', 'portal', 'automation']) {
      expect(ADMIN_WRITABLE_SETTING_SECTIONS).not.toContain(section)
    }
  })

  it('does not mutate the stored settings', () => {
    const incoming = mergeOrganizationSettings({ invoice: { due_days: 1 } } as any)
    applySettingsUpdate(stored, incoming, false)
    expect(stored.invoice.due_days).toBe(30)
  })
})
