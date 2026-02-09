import {
  uuidSchema,
  emailSchema,
  lockoutBodySchema,
  portalRequestLinkSchema,
  portalTokenSchema,
  resourcePatchSchema,
  sessionRequestSchema,
  parseBearer,
} from './schemas'

describe('uuidSchema', () => {
  it('accepts valid UUID v4', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('rejects invalid UUIDs', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(uuidSchema.safeParse('').success).toBe(false)
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716').success).toBe(false)
  })
})

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    const result = emailSchema.safeParse('User@Example.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('user@example.com') // lowercased and trimmed
    }
  })

  it('rejects emails with leading/trailing whitespace (validation before transform)', () => {
    // Note: Zod validates .email() before .transform() runs,
    // so whitespace-padded input is rejected at the validation step
    expect(emailSchema.safeParse('  test@test.com  ').success).toBe(false)
  })

  it('rejects invalid emails', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false)
    expect(emailSchema.safeParse('@missing-local.com').success).toBe(false)
    expect(emailSchema.safeParse('missing-domain@').success).toBe(false)
    expect(emailSchema.safeParse('').success).toBe(false)
  })
})

describe('lockoutBodySchema', () => {
  it('accepts valid check request', () => {
    const result = lockoutBodySchema.safeParse({
      email: 'user@test.com',
      action: 'check',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid record request with success flag', () => {
    const result = lockoutBodySchema.safeParse({
      email: 'user@test.com',
      action: 'record',
      success: false,
    })
    expect(result.success).toBe(true)
  })

  it('lowercases the email', () => {
    const result = lockoutBodySchema.safeParse({
      email: 'USER@TEST.COM',
      action: 'check',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@test.com')
    }
  })

  it('rejects invalid action', () => {
    expect(lockoutBodySchema.safeParse({
      email: 'user@test.com',
      action: 'invalid',
    }).success).toBe(false)
  })

  it('rejects missing email', () => {
    expect(lockoutBodySchema.safeParse({
      action: 'check',
    }).success).toBe(false)
  })

  it('rejects invalid email format', () => {
    expect(lockoutBodySchema.safeParse({
      email: 'not-an-email',
      action: 'check',
    }).success).toBe(false)
  })

  it('success is optional', () => {
    const result = lockoutBodySchema.safeParse({
      email: 'user@test.com',
      action: 'record',
    })
    expect(result.success).toBe(true)
  })
})

describe('portalRequestLinkSchema', () => {
  it('accepts valid email', () => {
    const result = portalRequestLinkSchema.safeParse({ email: 'client@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    expect(portalRequestLinkSchema.safeParse({}).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(portalRequestLinkSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})

describe('portalTokenSchema', () => {
  it('accepts non-empty strings', () => {
    expect(portalTokenSchema.safeParse('abc123').success).toBe(true)
  })

  it('rejects empty strings', () => {
    expect(portalTokenSchema.safeParse('').success).toBe(false)
  })
})

describe('resourcePatchSchema', () => {
  it('accepts valid resource patch', () => {
    const result = resourcePatchSchema.safeParse({
      resourceId: '550e8400-e29b-41d4-a716-446655440000',
      is_completed: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID resourceId', () => {
    expect(resourcePatchSchema.safeParse({
      resourceId: 'not-uuid',
      is_completed: true,
    }).success).toBe(false)
  })

  it('rejects non-boolean is_completed', () => {
    expect(resourcePatchSchema.safeParse({
      resourceId: '550e8400-e29b-41d4-a716-446655440000',
      is_completed: 'yes',
    }).success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(resourcePatchSchema.safeParse({}).success).toBe(false)
    expect(resourcePatchSchema.safeParse({ resourceId: '550e8400-e29b-41d4-a716-446655440000' }).success).toBe(false)
  })
})

describe('sessionRequestSchema', () => {
  it('accepts a full valid request', () => {
    const result = sessionRequestSchema.safeParse({
      preferred_date: '2025-03-15',
      preferred_time: '10:00',
      alternative_date: '2025-03-16',
      alternative_time: '14:00',
      duration_minutes: 45,
      service_type_id: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Prefer morning sessions',
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal required fields only', () => {
    const result = sessionRequestSchema.safeParse({
      preferred_date: '2025-03-15',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty preferred_date', () => {
    expect(sessionRequestSchema.safeParse({
      preferred_date: '',
    }).success).toBe(false)
  })

  it('rejects missing preferred_date', () => {
    expect(sessionRequestSchema.safeParse({
      preferred_time: '10:00',
    }).success).toBe(false)
  })

  it('accepts null for optional fields', () => {
    const result = sessionRequestSchema.safeParse({
      preferred_date: '2025-03-15',
      preferred_time: null,
      alternative_date: null,
      alternative_time: null,
      service_type_id: null,
      notes: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-integer duration_minutes', () => {
    expect(sessionRequestSchema.safeParse({
      preferred_date: '2025-03-15',
      duration_minutes: 45.5,
    }).success).toBe(false)
  })

  it('rejects negative duration_minutes', () => {
    expect(sessionRequestSchema.safeParse({
      preferred_date: '2025-03-15',
      duration_minutes: -30,
    }).success).toBe(false)
  })

  it('rejects non-UUID service_type_id', () => {
    expect(sessionRequestSchema.safeParse({
      preferred_date: '2025-03-15',
      service_type_id: 'not-a-uuid',
    }).success).toBe(false)
  })
})

describe('parseBearer', () => {
  it('extracts token from valid Bearer header', () => {
    expect(parseBearer('Bearer my-token-123')).toBe('my-token-123')
  })

  it('returns null for null header', () => {
    expect(parseBearer(null)).toBeNull()
  })

  it('returns null for non-Bearer header', () => {
    expect(parseBearer('Basic abc123')).toBeNull()
  })

  it('returns null for "Bearer " with no token', () => {
    expect(parseBearer('Bearer ')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseBearer('')).toBeNull()
  })

  it('handles tokens with special characters', () => {
    expect(parseBearer('Bearer eyJhbGciOiJIUzI1NiJ9.test.sig')).toBe('eyJhbGciOiJIUzI1NiJ9.test.sig')
  })
})
