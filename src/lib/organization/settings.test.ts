/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS, mergeOrganizationSettings } from './settings'

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

  it('uses the provided classrooms array when present', () => {
    const merged = mergeOrganizationSettings({ custom_lists: { classrooms: ['Room A'] } } as any)
    expect(merged.custom_lists.classrooms).toEqual(['Room A'])
  })

  it('does not mutate the defaults', () => {
    mergeOrganizationSettings({ pricing: { no_show_fee: 999 } } as any)
    expect(DEFAULT_SETTINGS.pricing.no_show_fee).toBe(60)
  })
})
