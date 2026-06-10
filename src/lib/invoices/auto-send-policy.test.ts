import { describe, it, expect } from 'vitest'
import { resolveAutoSendMethod } from './auto-send-policy'
import type { OrganizationSettings } from '@/types/database'

function settings(on: boolean, method: 'square' | 'email' | 'none'): OrganizationSettings {
  return {
    automation: { auto_send_invoice_on_approve: on, auto_send_invoice_method: method },
  } as unknown as OrganizationSettings
}

describe('resolveAutoSendMethod (regression for #8 — bulk approve respects auto-send setting)', () => {
  it('returns null when auto_send_invoice_on_approve is off, even if a method is set', () => {
    // The bug: bulk approve auto-sent Square invoices regardless of this flag.
    expect(resolveAutoSendMethod(settings(false, 'square'))).toBeNull()
    expect(resolveAutoSendMethod(settings(false, 'email'))).toBeNull()
  })

  it('returns the configured method when enabled', () => {
    expect(resolveAutoSendMethod(settings(true, 'square'))).toBe('square')
    expect(resolveAutoSendMethod(settings(true, 'email'))).toBe('email')
  })

  it("returns null for 'none' or missing settings", () => {
    expect(resolveAutoSendMethod(settings(true, 'none'))).toBeNull()
    expect(resolveAutoSendMethod(null)).toBeNull()
    expect(resolveAutoSendMethod(undefined)).toBeNull()
  })
})
