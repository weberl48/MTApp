/**
 * Parse a YYYY-MM-DD date string as local midnight (not UTC).
 * Prevents the off-by-one timezone bug with bare ISO date strings.
 *
 * JavaScript treats `new Date("2025-02-16")` as UTC midnight, which
 * shifts to the previous day in US timezones. Appending T00:00:00
 * forces local-time interpretation.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}
