import { describe, it, expect } from 'vitest'
import { isMfaGuardedApiPath } from './mfa-scope'

describe('isMfaGuardedApiPath (regression — aal1 sessions reached every API route)', () => {
  it('guards the PHI and money routes', () => {
    // The worst one: decrypts session notes server-side.
    expect(isMfaGuardedApiPath('/api/sessions/export')).toBe(true)
    expect(isMfaGuardedApiPath('/api/payroll/tax-summary')).toBe(true)
    expect(isMfaGuardedApiPath('/api/payroll/annual-summary/pdf')).toBe(true)
    expect(isMfaGuardedApiPath('/api/invoices/abc-123/pdf')).toBe(true)
    expect(isMfaGuardedApiPath('/api/invoices/abc-123/send')).toBe(true)
    expect(isMfaGuardedApiPath('/api/clients/abc-123/resources')).toBe(true)
    expect(isMfaGuardedApiPath('/api/clients/abc-123/access-token')).toBe(true)
    expect(isMfaGuardedApiPath('/api/help/chat')).toBe(true)
    expect(isMfaGuardedApiPath('/api/invites/user')).toBe(true)
    expect(isMfaGuardedApiPath('/api/session-requests/abc-123/approve')).toBe(true)
  })

  it('guards by default — a brand new API route needs no allow-list edit', () => {
    expect(isMfaGuardedApiPath('/api/something-invented-tomorrow')).toBe(true)
  })

  it('exempts routes that authenticate with a token, HMAC or secret', () => {
    expect(isMfaGuardedApiPath('/api/portal/sessions')).toBe(false)
    expect(isMfaGuardedApiPath('/api/portal/resources/abc/download')).toBe(false)
    expect(isMfaGuardedApiPath('/api/webhooks/square')).toBe(false)
    expect(isMfaGuardedApiPath('/api/cron/cleanup')).toBe(false)
    expect(isMfaGuardedApiPath('/api/health')).toBe(false)
    expect(isMfaGuardedApiPath('/api/health/live')).toBe(false)
    expect(isMfaGuardedApiPath('/api/health/restore')).toBe(false)
    expect(isMfaGuardedApiPath('/api/auth/login')).toBe(false)
    expect(isMfaGuardedApiPath('/api/invites/validate')).toBe(false)
    expect(isMfaGuardedApiPath('/api/dev/errors')).toBe(false)
  })

  it('does not touch page routes — those go through protectedPaths', () => {
    expect(isMfaGuardedApiPath('/dashboard/')).toBe(false)
    expect(isMfaGuardedApiPath('/login/')).toBe(false)
    expect(isMfaGuardedApiPath('/portal/sometoken')).toBe(false)
  })

  it('matches on a segment boundary so exemptions cannot widen by accident', () => {
    expect(isMfaGuardedApiPath('/api/portalx/secret')).toBe(true)
    expect(isMfaGuardedApiPath('/api/healthz')).toBe(true)
    expect(isMfaGuardedApiPath('/api/invites/validate-all')).toBe(true)
    expect(isMfaGuardedApiPath('/api/invites/validateXYZ')).toBe(true)
    // ...while the genuine sub-paths stay exempt.
    expect(isMfaGuardedApiPath('/api/invites/validate')).toBe(false)
    expect(isMfaGuardedApiPath('/api/health/ready')).toBe(false)
  })
})
