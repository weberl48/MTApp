/**
 * Parse a numeric settings input, returning the fallback ONLY for empty/non-numeric input.
 *
 * Crucially returns 0 for "0". The previous `parseFloat(value) || fallback` pattern coerced 0 to
 * the fallback, so a $0 no-show fee (an org that doesn't charge for no-shows) was impossible to
 * save, and clearing a field snapped it to the fallback mid-keystroke.
 */
export function parseSettingNumber(value: string, fallback: number): number {
  if (value.trim() === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const DEFAULT_DURATION_OPTIONS = [30, 45, 60, 90]

/**
 * Resolve the session duration options, falling back to the defaults when the configured list is
 * empty or missing. Clearing the "Duration Options" settings field saved an empty array, and the
 * session form rendered ZERO duration options for the whole org (an empty array isn't nullish, so
 * `?? defaults` didn't catch it).
 */
export function resolveDurationOptions(
  options: number[] | null | undefined,
  fallback: number[] = DEFAULT_DURATION_OPTIONS
): number[] {
  return options && options.length > 0 ? options : fallback
}
