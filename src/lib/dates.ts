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

/**
 * Get today's date as a YYYY-MM-DD string in the local timezone.
 *
 * `new Date().toISOString().split('T')[0]` returns a UTC date, which
 * shifts to tomorrow for US timezones after ~7–8 PM local time.
 */
export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
