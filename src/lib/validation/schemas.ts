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

/**
 * Extract bearer token from Authorization header.
 * Returns null if header is missing or malformed.
 */
export function parseBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return token || null
}
