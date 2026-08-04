'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_THEME_ID, isThemeId, THEME_STORAGE_KEY, type ThemeId } from './index'

/** Same-tab change notification — storage events only fire in OTHER tabs. */
const THEME_CHANGE_EVENT = 'mca:theme-change'

function readTheme(): ThemeId {
  const current = document.documentElement.getAttribute('data-theme')
  return isThemeId(current) ? current : DEFAULT_THEME_ID
}

function applyTheme(id: ThemeId) {
  if (id === DEFAULT_THEME_ID) {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', id)
  }
}

function subscribe(onStoreChange: () => void) {
  // Another tab changed the stored theme: mirror it onto this tab's <html>
  // (matching how next-themes syncs light/dark across tabs), then notify.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY) return
    applyTheme(isThemeId(e.newValue) ? e.newValue : DEFAULT_THEME_ID)
    onStoreChange()
  }
  const onLocalChange = () => onStoreChange()
  window.addEventListener('storage', onStorage)
  window.addEventListener(THEME_CHANGE_EVENT, onLocalChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(THEME_CHANGE_EVENT, onLocalChange)
  }
}

/**
 * Read/write the user's dashboard theme (data-theme on <html> + localStorage).
 * Initial paint is handled by the inline script in src/app/layout.tsx; this
 * hook mirrors that state for the Appearance picker, applies changes the user
 * makes, and follows changes made in other tabs. Server snapshot is the
 * default theme — useSyncExternalStore re-reads the real value on hydration.
 */
export function useAppTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME_ID)

  const setTheme = useCallback((id: ThemeId) => {
    applyTheme(id)
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
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }, [])

  return { theme, setTheme }
}
