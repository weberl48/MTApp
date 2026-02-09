import { vi, type Mock } from 'vitest'
import { checkLockout, recordLoginAttempt } from './lockout'

// Mock Supabase service client
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkLockout', () => {
  it('returns not locked when attempt count is below threshold', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ count: 2 }),
          }),
        }),
      }),
    })

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(false)
    expect(result.remainingMinutes).toBe(0)
    expect(result.attempts).toBe(2)
    expect(result.maxAttempts).toBe(5) // default
  })

  it('returns locked when attempts reach max (5 default)', async () => {
    const now = Date.now()
    // First call: count query
    // Second call: latest attempt query
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 5 }),
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { attempted_at: new Date(now - 60000).toISOString() }, // 1 min ago
                  }),
                }),
              }),
            }),
          }),
        }),
      }
    })

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(true)
    expect(result.remainingMinutes).toBeGreaterThan(0)
    expect(result.attempts).toBe(5)
    expect(result.maxAttempts).toBe(5)
  })

  it('returns not locked when lockout window has expired', async () => {
    const now = Date.now()
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 5 }),
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    // 20 minutes ago — beyond 15 min default lockout
                    data: { attempted_at: new Date(now - 20 * 60 * 1000).toISOString() },
                  }),
                }),
              }),
            }),
          }),
        }),
      }
    })

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(false)
  })

  it('uses custom maxAttempts and lockoutMinutes', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ count: 2 }),
          }),
        }),
      }),
    })

    const result = await checkLockout('user@test.com', {
      maxAttempts: 3,
      lockoutMinutes: 30,
    })

    expect(result.locked).toBe(false)
    expect(result.maxAttempts).toBe(3)
    expect(result.attempts).toBe(2)
  })

  it('lowercases the email for queries', async () => {
    const eqMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockResolvedValue({ count: 0 }),
      }),
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: eqMock,
      }),
    })

    await checkLockout('USER@TEST.COM')

    expect(eqMock).toHaveBeenCalledWith('email', 'user@test.com')
  })

  it('treats null count as 0 attempts', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ count: null }),
          }),
        }),
      }),
    })

    const result = await checkLockout('user@test.com')

    expect(result.locked).toBe(false)
    expect(result.attempts).toBe(0)
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
    })
  })

  it('inserts a successful login attempt', async () => {
    const insertMock = vi.fn().mockResolvedValue({})
    mockFrom.mockReturnValue({ insert: insertMock })

    await recordLoginAttempt('user@test.com', true)

    expect(insertMock).toHaveBeenCalledWith({
      email: 'user@test.com',
      success: true,
      ip_address: null,
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
