/**
 * Theme registry — the single source of truth for user-selectable dashboard
 * themes. Consumed by the pre-paint script in src/app/layout.tsx, the
 * Appearance picker, and the palette tests.
 *
 * A theme is a complete designed look: full CSS variable palette (light +
 * dark) in src/app/themes.css, plus font pairing, corner radius, and density
 * baked in. Classic is the built-in default: no data-theme attribute, no
 * localStorage entry. Spec: docs/superpowers/specs/2026-08-04-user-themes-design.md
 */

export type ThemeId =
  | 'classic'
  | 'ocean'
  | 'forest'
  | 'lavender'
  | 'sunset'
  | 'slate'
  | 'blossom'
  | 'sonata'

export interface ThemeDefinition {
  id: ThemeId
  label: string
  description: string
  /** Three representative light-mode colors shown as swatch dots in the picker. */
  swatch: [string, string, string]
}

export const THEME_STORAGE_KEY = 'mca-theme'
export const DEFAULT_THEME_ID: ThemeId = 'classic'

export const THEMES: ThemeDefinition[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'The original neutral look',
    swatch: ['#18181b', '#f4f4f5', '#71717a'],
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Calm teal-blue, soft and rounded',
    swatch: ['#0d7089', '#e3f2f7', '#173e4d'],
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Sage and moss, grounded and easy on the eyes',
    swatch: ['#41603f', '#e9efe4', '#25341f'],
  },
  {
    id: 'lavender',
    label: 'Lavender',
    description: 'Gentle violet, extra round and airy',
    swatch: ['#6b58b9', '#f0edf9', '#38305e'],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Warm terracotta with serif headings',
    swatch: ['#a5502a', '#f9efe4', '#573018'],
  },
  {
    id: 'slate',
    label: 'Slate',
    description: 'Dark sidebar, indigo accent, compact and sharp',
    swatch: ['#4f46e5', '#1e293b', '#e2e8f0'],
  },
  {
    id: 'blossom',
    label: 'Blossom',
    description: 'Soft rose, warm and nurturing',
    swatch: ['#a34d72', '#fbeef4', '#57263c'],
  },
  {
    id: 'sonata',
    label: 'Sonata',
    description: 'Sheet-music paper, ink, and Garamond',
    swatch: ['#211f1a', '#faf8f2', '#8a8477'],
  },
]

export const NON_DEFAULT_THEME_IDS: ThemeId[] = THEMES.map((t) => t.id).filter(
  (id) => id !== DEFAULT_THEME_ID,
)

const THEME_ID_SET = new Set<string>(THEMES.map((t) => t.id))

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_ID_SET.has(value)
}

/**
 * Every CSS variable a theme MUST define in both its light and dark blocks —
 * the full set globals.css defines for Classic. The palette completeness test
 * enforces this against themes.css so a theme can never inherit half of
 * another palette.
 */
export const REQUIRED_THEME_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-soft',
  'destructive-soft-foreground',
  'success',
  'success-foreground',
  'success-soft',
  'success-soft-foreground',
  'warning',
  'warning-foreground',
  'warning-soft',
  'warning-soft-foreground',
  'info',
  'info-foreground',
  'info-soft',
  'info-soft-foreground',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'skeleton',
] as const
