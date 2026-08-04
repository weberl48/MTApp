import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppTheme } from './use-app-theme'

describe('useAppTheme', () => {
  // Node 25's native webstorage stub shadows jsdom's localStorage in vitest
  // (methods are missing entirely), so back it with an in-memory Map — same
  // pattern as walkthroughs/completion.test.ts.
  beforeEach(() => {
    const store = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => { store.set(k, String(v)) },
        removeItem: (k: string) => { store.delete(k) },
        clear: () => { store.clear() },
      },
    })
    document.documentElement.removeAttribute('data-theme')
  })

  it('reflects the pre-paint attribute on first read', () => {
    document.documentElement.setAttribute('data-theme', 'forest')
    const { result } = renderHook(() => useAppTheme())
    expect(result.current.theme).toBe('forest')
  })

  it('setTheme applies the attribute, persists, and updates state', () => {
    const { result } = renderHook(() => useAppTheme())
    act(() => result.current.setTheme('ocean'))

    expect(result.current.theme).toBe('ocean')
    expect(document.documentElement.getAttribute('data-theme')).toBe('ocean')
    expect(window.localStorage.getItem('mca-theme')).toBe('ocean')
  })

  it('setTheme(classic) clears the attribute and the stored value', () => {
    const { result } = renderHook(() => useAppTheme())
    act(() => result.current.setTheme('ocean'))
    act(() => result.current.setTheme('classic'))

    expect(result.current.theme).toBe('classic')
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    expect(window.localStorage.getItem('mca-theme')).toBeNull()
  })

  it('follows a theme change made in another tab (storage event)', () => {
    const { result } = renderHook(() => useAppTheme())
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'mca-theme', newValue: 'lavender' }),
      )
    })

    expect(result.current.theme).toBe('lavender')
    expect(document.documentElement.getAttribute('data-theme')).toBe('lavender')
  })

  it('ignores storage events for other keys', () => {
    const { result } = renderHook(() => useAppTheme())
    act(() => result.current.setTheme('ocean'))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: 'dark' }))
    })

    expect(result.current.theme).toBe('ocean')
  })
})
