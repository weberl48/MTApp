/**
 * OKLCH color math for theme contrast validation.
 *
 * The theme palettes in src/app/themes.css are authored in OKLCH; the WCAG
 * contrast formula needs linear-sRGB relative luminance. Conversion chain:
 * OKLCH → OKLab → LMS → linear sRGB → relative luminance.
 */

export interface Oklch {
  l: number
  c: number
  h: number
}

const OKLCH_RE =
  /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+%?)?\s*\)$/

export function parseOklch(value: string): Oklch | null {
  const m = value.trim().match(OKLCH_RE)
  if (!m) return null
  return { l: parseFloat(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]) }
}

/** Relative luminance (WCAG definition) of an OKLCH color, clamped to gamut. */
export function relativeLuminance({ l, c, h }: Oklch): number {
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const lms = [l_ ** 3, m_ ** 3, s_ ** 3]

  const r = 4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2]
  const g = -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2]
  const bl = -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2]

  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(bl)
}

/** WCAG contrast ratio between two oklch() strings. Throws on unparseable input. */
export function contrastRatio(colorA: string, colorB: string): number {
  const a = parseOklch(colorA)
  const b = parseOklch(colorB)
  if (!a || !b) {
    throw new Error(`contrastRatio expects oklch() values, got: ${colorA} / ${colorB}`)
  }
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}
