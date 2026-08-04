'use client'

import { useCallback, useState } from 'react'
import { DEFAULT_THEME_ID, isThemeId, THEME_STORAGE_KEY, type ThemeId } from './index'

/**
 * Read/write the user's dashboard theme (data-theme on <html> + localStorage).
 * Initial paint is handled by the inline script in src/app/layout.tsx; this
 * hook only needs to mirror that state for the Appearance picker and apply
 * changes the user makes.
 */
export function useAppTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof document === 'undefined') return DEFAULT_THEME_ID
    const current = document.documentElement.getAttribute('data-theme')
    return isThemeId(current) ? current : DEFAULT_THEME_ID
  })

  const setTheme = useCallback((id: ThemeId) => {
    if (id === DEFAULT_THEME_ID) {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', id)
    }
    try {
      if (id === DEFAULT_THEME_ID) {
        window.localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, id)
      }
    } catch {
      // localStorage unavailable (e.g. private browsing) — the theme still
      // applies for this page load, it just won't persist.
    }
    setThemeState(id)
  }, [])

  return { theme, setTheme }
}
