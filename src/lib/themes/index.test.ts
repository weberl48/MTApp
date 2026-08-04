import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME_ID,
  isThemeId,
  NON_DEFAULT_THEME_IDS,
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
