import { describe, it, expect } from 'vitest'
import { shouldDevAutoLogin, isLocalSupabaseUrl } from './dev-auto-login'

const base = {
  nodeEnv: 'development',
  flag: '1',
  supabaseUrl: 'http://127.0.0.1:54321',
  password: 'pw',
  pathname: '/dashboard/',
  hasUser: false,
}

describe('shouldDevAutoLogin', () => {
  it('allows on a protected path with all gates open', () => {
    expect(shouldDevAutoLogin(base)).toBe(true)
  })

  it('never fires outside development builds', () => {
    expect(shouldDevAutoLogin({ ...base, nodeEnv: 'production' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, nodeEnv: 'test' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, nodeEnv: undefined })).toBe(false)
  })

  it('requires the explicit opt-in flag', () => {
    expect(shouldDevAutoLogin({ ...base, flag: undefined })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, flag: '0' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, flag: 'true' })).toBe(false)
  })

  // This gate previously REQUIRED the MCA-Dev ref. That project became cert and
  // now holds real production PHI, so the old check pointed auto-login at the
  // very database it existed to protect against. Loopback-only closes that.
  it('refuses every cloud project, including cert', () => {
    expect(shouldDevAutoLogin({ ...base, supabaseUrl: 'https://ysmwowzxkgisshaormmf.supabase.co' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, supabaseUrl: 'https://gzrukevymmguqxuoynqk.supabase.co' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, supabaseUrl: 'https://anything-else.supabase.co' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, supabaseUrl: undefined })).toBe(false)
  })

  it('accepts only loopback hosts', () => {
    for (const url of ['http://127.0.0.1:54321', 'http://localhost:54321']) {
      expect(isLocalSupabaseUrl(url), url).toBe(true)
    }
    for (const url of ['https://gzrukevymmguqxuoynqk.supabase.co', 'https://example.com', 'not a url', '']) {
      expect(isLocalSupabaseUrl(url), url).toBe(false)
    }
    expect(isLocalSupabaseUrl(undefined)).toBe(false)
  })

  // A cloud ref must lose even if it is somehow dressed up as a loopback host.
  it('blocklist beats a spoofed loopback host', () => {
    expect(isLocalSupabaseUrl('http://127.0.0.1:54321/gzrukevymmguqxuoynqk')).toBe(false)
  })

  it('requires a password and no existing session', () => {
    expect(shouldDevAutoLogin({ ...base, password: undefined })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, password: '' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, hasUser: true })).toBe(false)
  })

  it('leaves auth pages alone so manual login/sign-out/e2e still work', () => {
    for (const p of ['/login/', '/signup/', '/reset-password/', '/auth/callback/', '/mfa-verify/']) {
      expect(shouldDevAutoLogin({ ...base, pathname: p }), p).toBe(false)
    }
  })
})
