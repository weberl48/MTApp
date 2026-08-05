'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 1023px)'

function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

const getSnapshot = () => window.matchMedia(QUERY).matches
const getServerSnapshot = () => false

/**
 * Below Tailwind's `lg` breakpoint. Same pattern as
 * `src/components/pwa/install-prompt.tsx` and `sidebar.tsx`'s viewport
 * check: `useSyncExternalStore` over `matchMedia`, not `useEffect` +
 * `useState`, so there is no setState-in-effect and no hydration flash.
 * Server/first-render snapshot is always false — callers must be
 * skeleton-first (mobile content branches never flash).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * True only after hydration (server snapshot false, client always true).
 * Companion to useIsMobile for post-hydration unmount gates: lg:hidden /
 * hidden lg:* classes keep the pre-hydration paint correct, and once
 * hydrated the wrong-viewport shell component unmounts so its CSS-hidden
 * text stops resolving in the DOM (strict-mode locators, AT tooling).
 * useSyncExternalStore keeps this render-pure (no setState-in-effect).
 */
const emptySubscribe = () => () => {}
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}
