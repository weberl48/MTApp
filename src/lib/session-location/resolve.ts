import type { Client, ServiceType } from '@/types/database'

/**
 * The session-location field, when a session must record one. Two triggers:
 *
 *   - `service_types.requires_classroom` → "Classroom" (wins when both apply)
 *   - `clients.requires_location` on any involved client → "Location"
 *
 * Free text only; the field is always required when it resolves. Values land in
 * `sessions.classroom` and print on invoices whenever present.
 */
export interface LocationField {
  label: 'Classroom' | 'Location'
}

export function resolveLocationField(
  serviceType: Pick<ServiceType, 'requires_classroom'> | null | undefined,
  clients: Array<Pick<Client, 'requires_location'>>
): LocationField | null {
  if (serviceType?.requires_classroom) return { label: 'Classroom' }
  if (clients.some((c) => c.requires_location)) return { label: 'Location' }
  return null
}

/** Whitespace is not a value — a required location must not pass on spaces. */
export function isLocationProvided(value: string): boolean {
  return value.trim().length > 0
}
