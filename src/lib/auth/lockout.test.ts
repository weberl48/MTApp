import { vi } from 'vitest'
import { checkLockout, recordLoginAttempt } from './lockout'

// Mock Supabase service client
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}))

/**
 * Chainable query mock: every builder method returns the same object; the
 * terminal methods resolve with the configured results. checkLockout issues
 * up to three queries, in order:
 *   1. last-success lookup   → terminal .maybeSingle()
 *   2. failure count         → terminal .gte()
 *   3. latest failed attempt → terminal .single() (only when locked)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function chain(results: { gte?: any; maybeSingle?: any; single?: any } = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = {}
  for (const m of ['select', 'eq', 'order', 'limit']) {
    obj[m] = vi.fn().mockReturnValue(obj)
  }
  obj.gte = vi.fn().mockResolvedValue(results.gte ?? { count: 0 })
  obj.maybeSingle = vi.fn().mockResolvedValue(results.maybeSingle ?? { data: null })
  obj.single = vi.fn().mockResolvedValue(results.single ?? { data: null })
  return obj
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockQueries(...chains: any[]) {
  let call = 0
  mockFrom.mockImplementation(() => chains[Math.min(call++, chains.length - 1)])
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkLockout', () => {
  it('returns not locked when attempt count is below threshold', async () => {
    mockQueries(chain(), chain({ gte: { count: 2 } }))

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(false)
    expect(result.remainingMinutes).toBe(0)
    expect(result.attempts).toBe(2)
    expect(result.maxAttempts).toBe(5) // default
  })

  it('returns locked when attempts reach max (5 default)', async () => {
    const now = Date.now()
    mockQueries(
      chain(),
      chain({ gte: { count: 5 } }),
      chain({ single: { data: { attempted_at: new Date(now - 60000).toISOString() } } })
    )

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(true)
    expect(result.remainingMinutes).toBeGreaterThan(0)
    expect(result.attempts).toBe(5)
    expect(result.maxAttempts).toBe(5)
  })

  it('returns not locked when lockout window has expired', async () => {
    const now = Date.now()
    mockQueries(
      chain(),
      chain({ gte: { count: 5 } }),
      chain({
        // 20 minutes ago — beyond 15 min default lockout
        single: { data: { attempted_at: new Date(now - 20 * 60 * 1000).toISOString() } },
      })
    )

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(false)
  })

  it('uses custom maxAttempts and lockoutMinutes', async () => {
    mockQueries(chain(), chain({ gte: { count: 2 } }))

    const result = await checkLockout('user@test.com', null, {
      maxAttempts: 3,
      lockoutMinutes: 30,
    })

    expect(result.locked).toBe(false)
    expect(result.maxAttempts).toBe(3)
    expect(result.attempts).toBe(2)
  })

  it('scopes the lockout count to the requesting IP (regression for #2 — lockout DoS)', async () => {
    // With an IP, the count query must filter on ip_address so an attacker spamming a
    // victim's email from a different IP cannot lock the victim out from their own IP.
    const successChain = chain()
    const countChain = chain({ gte: { count: 1 } })
    mockQueries(successChain, countChain)

    const result = await checkLockout('victim@test.com', '203.0.113.9')

    expect(countChain.eq).toHaveBeenCalledWith('email', 'victim@test.com')
    expect(countChain.eq).toHaveBeenCalledWith('ip_address', '203.0.113.9')
    expect(successChain.eq).toHaveBeenCalledWith('ip_address', '203.0.113.9')
    expect(result.attempts).toBe(1)
    expect(result.locked).toBe(false)
  })

  it('lowercases the email for queries', async () => {
    const successChain = chain()
    const countChain = chain({ gte: { count: 0 } })
    mockQueries(successChain, countChain)

    await checkLockout('USER@TEST.COM')

    expect(countChain.eq).toHaveBeenCalledWith('email', 'user@test.com')
  })

  it('treats null count as 0 attempts', async () => {
    mockQueries(chain(), chain({ gte: { count: null } }))

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(false)
    expect(result.attempts).toBe(0)
  })

  it('a successful login resets the failure window (4 typos + success + 1 typo ≠ locked)', async () => {
    // Success 2 minutes ago, inside the 15-min window: only failures AFTER it
    // may count, so the count query's .gte must use the success timestamp,
    // not the window start.
    const successAt = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const countChain = chain({ gte: { count: 1 } })
    mockQueries(chain({ maybeSingle: { data: { attempted_at: successAt } } }), countChain)

    const result = await checkLockout('user@test.com')

    expect(countChain.gte).toHaveBeenCalledWith('attempted_at', successAt)
    expect(result.locked).toBe(false)
    expect(result.attempts).toBe(1)
  })

  it('ignores successes older than the lockout window', async () => {
    // Success 30 minutes ago is outside the 15-min window — the window start
    // (a more recent bound) must win.
    const staleSuccess = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const countChain = chain({ gte: { count: 3 } })
    mockQueries(chain({ maybeSingle: { data: { attempted_at: staleSuccess } } }), countChain)

    await checkLockout('user@test.com')

    const gteArg = countChain.gte.mock.calls[0][1] as string
    expect(gteArg > staleSuccess).toBe(true)
  })
})

describe('recordLoginAttempt', () => {
  it('inserts a failed login attempt', async () => {
    const insertMock = vi.fn().mockResolvedValue({})
    mockFrom.mockReturnValue({ insert: insertMock })

    await recordLoginAttempt('user@test.com', false, '192.168.1.1')

    expect(mockFrom).toHaveBeenCalledWith('login_attempts')
    expect(insertMock).toHaveBeenCalledWith({
      email: 'user@test.com',
      success: false,
      ip_address: '192.168.1.1',
      organization_id: null,
    })
  })

  it('records the organization id when provided', async () => {
    const insertMock = vi.fn().mockResolvedValue({})
    mockFrom.mockReturnValue({ insert: insertMock })

    await recordLoginAttempt('user@test.com', false, '1.2.3.4', 'org-123')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ organization_id: 'org-123' })
    )
  })

  it('inserts a successful login attempt', async () => {
    const insertMock = vi.fn().mockResolvedValue({})
    mockFrom.mockReturnValue({ insert: insertMock })

    await recordLoginAttempt('user@test.com', true)

    expect(insertMock).toHaveBeenCalledWith({
      email: 'user@test.com',
      success: true,
      ip_address: null,
      organization_id: null,
    })
  })

  it('lowercases the email', async () => {
    const insertMock = vi.fn().mockResolvedValue({})
    mockFrom.mockReturnValue({ insert: insertMock })

    await recordLoginAttempt('USER@TEST.COM', false)

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@test.com' })
    )
  })
})
