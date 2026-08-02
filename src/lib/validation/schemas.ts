import { z } from 'zod'

/** UUID v4 format validator */
export const uuidSchema = z.string().uuid()

/** Email validator (trimmed, lowercased) */
export const emailSchema = z.string().email().transform(val => val.toLowerCase().trim())

/** Lockout API request body */
export const lockoutBodySchema = z.object({
  email: emailSchema,
  action: z.enum(['check', 'record']),
  success: z.boolean().optional(),
})

/** Server-side login body (POST /api/auth/login) */
export const loginBodySchema = z.object({
  email: emailSchema,
  // No max/complexity rules here on purpose: this validates a login attempt, not
  // a new password. Rejecting an over-long password would leak that the policy
  // changed and breaks nothing an attacker cares about.
  password: z.string().min(1),
})

/** Portal request-link body */
export const portalRequestLinkSchema = z.object({
  email: emailSchema,
})

/** Portal token validator */
export const portalTokenSchema = z.string().min(1)

/** Portal resource PATCH body */
export const resourcePatchSchema = z.object({
  resourceId: z.string().uuid(),
  is_completed: z.boolean(),
})

/** Portal session request body */
export const sessionRequestSchema = z.object({
  preferred_date: z.string().min(1, 'Preferred date is required'),
  preferred_time: z.string().optional().nullable(),
  alternative_date: z.string().optional().nullable(),
  alternative_time: z.string().optional().nullable(),
  duration_minutes: z.number().int().positive().optional(),
  service_type_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

/** Tax year for payroll annual summaries (coerced from a query-string value) */
// z.coerce turns null/'' into 0, rejected only via .min(2000) — not a type check.
export const taxYearSchema = z.coerce.number().int().min(2000).max(2100)

/**
 * Extract bearer token from Authorization header.
 * Returns null if header is missing or malformed.
 */
export function parseBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return token || null
}

/** AI help chat request: bounded conversation history ending with the user. */
export const helpChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(20)
    .refine(msgs => msgs[msgs.length - 1].role === 'user', {
      message: 'Last message must be from the user',
    }),
})
