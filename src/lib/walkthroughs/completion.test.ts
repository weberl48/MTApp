// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  COMPLETED_WALKTHROUGHS_KEY,
  WALKTHROUGHS_CHANGED_EVENT,
  RECOMMENDED_WALKTHROUGH_ORDER,
  getCompletedWalkthroughs,
  markWalkthroughCompleted,
  nextRecommendedWalkthrough,
} from './completion'

describe('completed walkthrough storage', () => {
  // Node 25's native webstorage stub shadows jsdom's localStorage in vitest
  // (methods are missing entirely), so back it with an in-memory Map — same
  // pattern as session-form/defaults.test.ts.
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
  })

  it('starts empty and round-trips completions', () => {
    expect(getCompletedWalkthroughs()).toEqual([])
    markWalkthroughCompleted('app-overview')
    markWalkthroughCompleted('log-session')
    expect(getCompletedWalkthroughs()).toEqual(['app-overview', 'log-session'])
  })

  it('does not duplicate an already-completed id', () => {
    markWalkthroughCompleted('app-overview')
    markWalkthroughCompleted('app-overview')
    expect(getCompletedWalkthroughs()).toEqual(['app-overview'])
  })

  it('dispatches the changed event so UI can refresh', () => {
    const listener = vi.fn()
    window.addEventListener(WALKTHROUGHS_CHANGED_EVENT, listener)
    markWalkthroughCompleted('app-overview')
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener(WALKTHROUGHS_CHANGED_EVENT, listener)
  })

  it('survives corrupted storage', () => {
    window.localStorage.setItem(COMPLETED_WALKTHROUGHS_KEY, '{not json')
    expect(getCompletedWalkthroughs()).toEqual([])
    window.localStorage.setItem(COMPLETED_WALKTHROUGHS_KEY, JSON.stringify({ nope: 1 }))
    expect(getCompletedWalkthroughs()).toEqual([])
    window.localStorage.setItem(COMPLETED_WALKTHROUGHS_KEY, JSON.stringify(['ok', 42]))
    expect(getCompletedWalkthroughs()).toEqual(['ok'])
  })
})

describe('nextRecommendedWalkthrough', () => {
  it('suggests the first not-yet-done tour in recommended order', () => {
    expect(nextRecommendedWalkthrough('app-overview', [])).toBe('approve-sessions')
    expect(nextRecommendedWalkthrough('approve-sessions', ['app-overview'])).toBe('log-session')
  })

  it('counts the just-completed tour as done even before storage updates', () => {
    expect(nextRecommendedWalkthrough('approve-sessions', [])).toBe('app-overview')
  })

  it('skips tours rejected by the allowed filter (contractor role)', () => {
    const contractorAllowed = (id: string) =>
      ['app-overview', 'log-session', 'my-earnings'].includes(id)
    expect(nextRecommendedWalkthrough('app-overview', [], contractorAllowed)).toBe('log-session')
    expect(nextRecommendedWalkthrough('log-session', ['app-overview'], contractorAllowed)).toBe('my-earnings')
    expect(
      nextRecommendedWalkthrough('my-earnings', ['app-overview', 'log-session'], contractorAllowed)
    ).toBeNull()
  })

  it('returns null when everything is done', () => {
    expect(nextRecommendedWalkthrough('edit-service-type', [...RECOMMENDED_WALKTHROUGH_ORDER])).toBeNull()
  })
})
