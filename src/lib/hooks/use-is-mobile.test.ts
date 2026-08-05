import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useIsMobile } from './use-is-mobile'

type Listener = (e: MediaQueryListEvent) => void

/** Minimal matchMedia stub that supports the addEventListener/removeEventListener
 *  wiring useSyncExternalStore relies on, plus a way to fire a synthetic change. */
function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<Listener>()
  let matches = initialMatches
  const mql = {
    get matches() {
      return matches
    },
    media: '(max-width: 1023px)',
    addEventListener: vi.fn((_: string, cb: Listener) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: Listener) => listeners.delete(cb)),
  }
  const matchMedia = vi.fn().mockReturnValue(mql)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  })
  return {
    matchMedia,
    mql,
    setMatches(next: boolean) {
      matches = next
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent))
    },
  }
}

describe('useIsMobile', () => {
  it('queries exactly the 1023px breakpoint', () => {
    const { matchMedia } = installMatchMedia(false)
    renderHook(() => useIsMobile())
    expect(matchMedia).toHaveBeenCalledWith('(max-width: 1023px)')
  })

  it('returns the current match on first client render', () => {
    installMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when the viewport is not narrow', () => {
    installMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('subscribes to change events and updates when the media query flips', () => {
    const { setMatches } = installMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => setMatches(true))
    expect(result.current).toBe(true)

    act(() => setMatches(false))
    expect(result.current).toBe(false)
  })

  it('subscribes and unsubscribes via addEventListener/removeEventListener("change", ...)', () => {
    const { mql } = installMatchMedia(false)
    const { unmount } = renderHook(() => useIsMobile())

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    const registered = mql.addEventListener.mock.calls[0][1]

    unmount()
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', registered)
  })
})
