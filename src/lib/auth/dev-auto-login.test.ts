import { describe, it, expect } from 'vitest'
import { shouldDevAutoLogin } from './dev-auto-login'

const base = {
  nodeEnv: 'development',
  flag: '1',
  supabaseUrl: 'https://gzrukevymmguqxuoynqk.supabase.co',
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

  it('refuses any non-dev Supabase project (prod ref, missing url)', () => {
    expect(shouldDevAutoLogin({ ...base, supabaseUrl: 'https://ysmwowzxkgisshaormmf.supabase.co' })).toBe(false)
    expect(shouldDevAutoLogin({ ...base, supabaseUrl: undefined })).toBe(false)
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
