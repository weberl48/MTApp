import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import {
  DEFAULT_THEME_ID,
  isThemeId,
  NON_DEFAULT_THEME_IDS,
  REQUIRED_THEME_TOKENS,
  THEMES,
  THEME_STORAGE_KEY,
} from './index'

describe('theme registry', () => {
  it('has eight themes with classic first as default', () => {
    expect(THEMES).toHaveLength(8)
    expect(THEMES[0].id).toBe('classic')
    expect(DEFAULT_THEME_ID).toBe('classic')
  })

  it('has unique ids and NON_DEFAULT_THEME_IDS excludes classic', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(NON_DEFAULT_THEME_IDS).toEqual(ids.filter((id) => id !== 'classic'))
  })

  it('validates ids', () => {
    expect(isThemeId('ocean')).toBe(true)
    expect(isThemeId('neon')).toBe(false)
    expect(isThemeId(null)).toBe(false)
  })

  it('uses the agreed storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('mca-theme')
  })

  it('every theme has a label, description, and three swatch colors', () => {
    for (const theme of THEMES) {
      expect(theme.label.length).toBeGreaterThan(0)
      expect(theme.description.length).toBeGreaterThan(0)
      expect(theme.swatch).toHaveLength(3)
      for (const hex of theme.swatch) expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

const css = readFileSync(join(process.cwd(), 'src/app/themes.css'), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(selector)
  expect(start, `missing block ${selector}`).toBeGreaterThan(-1)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

function token(body: string, name: string): string | undefined {
  return body.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim()
}

// Exact selector spellings, not substrings: '[data-theme="x"]' is a substring
// of 'html.dark[data-theme="x"]', so a bare-substring lookup would silently
// depend on light-before-dark authoring order in themes.css.
const lightSel = (id: string) => `html[data-theme="${id}"]`
const darkSel = (id: string) => `html.dark[data-theme="${id}"]`

describe('themes.css completeness', () => {
  for (const id of NON_DEFAULT_THEME_IDS) {
    it(`${id} defines every token in both modes`, () => {
      for (const sel of [lightSel(id), darkSel(id)]) {
        const body = block(sel)
        for (const t of REQUIRED_THEME_TOKENS) {
          expect(token(body, `--${t}`), `${sel} missing --${t}`).toBeTruthy()
        }
      }
    })
  }
})

describe('themes.css contrast (WCAG AA)', () => {
  const pairs: Array<[string, string]> = [
    ['primary', 'primary-foreground'],
    ['background', 'foreground'],
    ['card', 'card-foreground'],
    ['sidebar', 'sidebar-foreground'],
    // Sidebar nav states: active/hover items render sidebar-accent-foreground
    // on sidebar-accent, and the active leaf pill renders
    // sidebar-primary-foreground on sidebar-primary.
    ['sidebar-accent', 'sidebar-accent-foreground'],
    ['sidebar-primary', 'sidebar-primary-foreground'],
    // Dropdown hover/current rows and the avatar-fallback initials.
    ['accent', 'accent-foreground'],
    ['secondary', 'secondary-foreground'],
  ]
  for (const id of NON_DEFAULT_THEME_IDS) {
    for (const sel of [lightSel(id), darkSel(id)]) {
      it(`${sel} key pairs >= 4.5:1`, () => {
        const body = block(sel)
        for (const [bg, fg] of pairs) {
          const ratio = contrastRatio(token(body, `--${bg}`)!, token(body, `--${fg}`)!)
          expect(
            ratio,
            `${sel} ${bg}/${fg} = ${ratio.toFixed(2)}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
      })
    }
  }
})
