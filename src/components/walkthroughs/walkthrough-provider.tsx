'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { Walkthrough, WalkthroughStep } from './walkthrough-types'
import { getWalkthroughById } from './walkthroughs'

type WalkthroughContextValue = {
  activeWalkthrough: Walkthrough | null
  stepIndex: number
  startWalkthrough: (id: string) => void
  stopWalkthrough: () => void
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null)

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext)
  if (!ctx) {
    throw new Error('useWalkthrough must be used within WalkthroughProvider')
  }
  return ctx
}

/** Extract only the pathname from an href (strip query string and hash). */
function hrefPathname(href: string): string {
  try { return new URL(href, window.location.origin).pathname }
  catch { return href.split('?')[0].split('#')[0] }
}

/** Below Tailwind's lg breakpoint the sidebar is an off-canvas drawer. */
function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 1023px)').matches
}

/**
 * A step target is highlightable if it has layout and isn't parked off-canvas.
 * Elements below/right of the viewport still count — they can be scrolled into
 * view — but the mobile drawer sitting at -translate-x-full (right edge <= 0)
 * cannot, so it's treated as hidden until the drawer opens.
 */
function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  if (rect.right <= 0 || rect.bottom <= 0) return false
  return true
}

/**
 * Resolve a step's target, preferring the first VISIBLE match. The selector may
 * list comma-separated fallbacks (desktop element first, mobile fallback second).
 * Returns undefined when nothing is visible so driver.js renders the popover
 * centered instead of highlighting a hidden element.
 */
function resolveStepElement(selector: string): Element | undefined {
  for (const sel of selector.split(',').map((s) => s.trim()).filter(Boolean)) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      if (isElementVisible(el)) return el
    }
  }
  return undefined
}

/** Ask the sidebar to open/close its mobile drawer (no-op state on desktop). */
function syncMobileNavDrawer(step: WalkthroughStep | undefined) {
  window.dispatchEvent(
    new CustomEvent('mca:walkthrough-nav', {
      detail: { open: !!step?.mobileNav && isMobileViewport() },
    })
  )
}

/** Does the current URL already satisfy this step's href? */
function stepNeedsNavigation(step: WalkthroughStep): boolean {
  if (!step.href) return false
  const currentUrl = window.location.pathname + window.location.search
  return (
    !window.location.pathname.startsWith(hrefPathname(step.href)) ||
    (step.href.includes('?') && !currentUrl.includes(step.href.split('?')[1]))
  )
}

/**
 * Scroll an element into view within its nearest scrollable ancestor.
 * Standard scrollIntoView scrolls the whole page; this scrolls the
 * dialog/overflow container so the field is visible.
 */
function scrollElementIntoView(el: Element) {
  // Find the closest vertically scrollable parent (e.g., the dialog content)
  let scrollParent: Element | null = el.parentElement
  while (scrollParent) {
    const style = window.getComputedStyle(scrollParent)
    if (
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      scrollParent.scrollHeight > scrollParent.clientHeight
    ) {
      break
    }
    scrollParent = scrollParent.parentElement
  }

  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    // Scroll so the element is near the top of the scrollable area with some padding
    const scrollOffset = elRect.top - parentRect.top - 20
    scrollParent.scrollBy({ top: scrollOffset, behavior: 'smooth' })
  }

  // Also handle horizontally scrollable containers (e.g. the invoices tab bar
  // on mobile, where the Scholarship tab starts off-screen to the right).
  let hScrollParent: Element | null = el.parentElement
  while (hScrollParent) {
    const style = window.getComputedStyle(hScrollParent)
    if (
      (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
      hScrollParent.scrollWidth > hScrollParent.clientWidth
    ) {
      break
    }
    hScrollParent = hScrollParent.parentElement
  }

  if (hScrollParent) {
    const parentRect = hScrollParent.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const scrollOffset = elRect.left - parentRect.left - 20
    hScrollParent.scrollBy({ left: scrollOffset, behavior: 'smooth' })
  }
}

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeWalkthrough, setActiveWalkthrough] = useState<Walkthrough | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const driverRef = useRef<Driver | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startWalkthrough = useCallback((id: string) => {
    const walkthrough = getWalkthroughById(id)
    if (!walkthrough) return

    // Tear down anything already in-flight so a double-start can't leave two live driver
    // instances / overlays, and a pending start-timeout can't fire after this one.
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (driverRef.current) {
      driverRef.current.destroy()
      driverRef.current = null
    }

    setActiveWalkthrough(walkthrough)
    setStepIndex(0)

    /**
     * Poll until a step's page has loaded and its target is visible (drawer
     * opened, page rendered), then continue. Times out to a centered popover
     * rather than blocking the tour.
     */
    function waitForStepReady(step: WalkthroughStep, done: () => void) {
      const startedAt = Date.now()
      const tick = () => {
        const pathReady = !step.href || window.location.pathname.startsWith(hrefPathname(step.href))
        const elementReady = !step.element || !!resolveStepElement(step.element)
        if ((pathReady && elementReady) || Date.now() - startedAt > 2500) {
          done()
          return
        }
        timeoutRef.current = setTimeout(tick, 100)
      }
      tick()
    }

    // Prepare the first step: sync the mobile drawer and navigate if needed
    const firstStep = walkthrough.steps[0]
    syncMobileNavDrawer(firstStep)
    if (firstStep.href && !pathname.startsWith(hrefPathname(firstStep.href))) {
      router.push(firstStep.href)
    }

    /**
     * Move to an adjacent step ourselves: sync the drawer, navigate, wait for
     * the target page/element to be ready, THEN let driver.js advance. Without
     * this, driver resolves the next element before navigation/drawer
     * transitions finish and silently falls back to a centered popover.
     */
    function advance(driverInstance: Driver, direction: 1 | -1) {
      const current = driverInstance.getActiveIndex() ?? 0
      const nextIndex = current + direction
      if (nextIndex < 0) return
      if (nextIndex >= walkthrough!.steps.length) {
        driverInstance.destroy()
        return
      }
      const nextStep = walkthrough!.steps[nextIndex]
      syncMobileNavDrawer(nextStep)
      if (stepNeedsNavigation(nextStep)) {
        router.push(nextStep.href)
      }
      waitForStepReady(nextStep, () => {
        if (direction === 1) driverInstance.moveNext()
        else driverInstance.movePrevious()
      })
    }

    // Small delay to let navigation kick off, then wait for the first target
    timeoutRef.current = setTimeout(() => {
      waitForStepReady(firstStep, () => {
        const driverInstance = driver({
          showProgress: true,
          animate: true,
          overlayColor: 'black',
          stagePadding: 8,
          stageRadius: 8,
          allowClose: false,
          popoverClass: 'mca-walkthrough-popover',
          // The X button still works via onCloseClick even with allowClose: false
          onCloseClick: () => {
            driverInstance.destroy()
          },
          onNextClick: () => advance(driverInstance, 1),
          onPrevClick: () => advance(driverInstance, -1),
          steps: walkthrough.steps.map((step, i) => ({
            // Resolved at highlight time: first visible match wins; undefined
            // (nothing visible) makes driver.js render a centered popover.
            element: step.element
              ? ((() => resolveStepElement(step.element!)) as () => Element)
              : undefined,
            popover: {
              title: step.title,
              description: step.description,
              side: step.popoverSide || ('bottom' as const),
              align: 'center' as const,
              showButtons: ['next', 'previous', 'close'] as const,
            },
            onHighlightStarted: () => {
              setStepIndex(i)
              // Scroll the target into view within its scrollable container(s)
              if (step.element) {
                requestAnimationFrame(() => {
                  const el = resolveStepElement(step.element!)
                  if (el) scrollElementIntoView(el)
                })
              }
            },
          })),
          onDestroyed: () => {
            syncMobileNavDrawer(undefined)
            setActiveWalkthrough(null)
            setStepIndex(0)
            driverRef.current = null
          },
        })

        driverRef.current = driverInstance
        driverInstance.drive()
      })
    }, 150)
  }, [pathname, router])

  const stopWalkthrough = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (driverRef.current) {
      driverRef.current.destroy()
    }
    setActiveWalkthrough(null)
    setStepIndex(0)
  }, [])

  // On unmount (e.g. the dashboard tears down after a session-timeout sign-out mid-tour),
  // destroy any live driver overlay and clear a pending start-timeout so nothing lingers.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (driverRef.current) {
        driverRef.current.destroy()
        driverRef.current = null
      }
    }
  }, [])

  return (
    <WalkthroughContext.Provider
      value={{
        activeWalkthrough,
        stepIndex,
        startWalkthrough,
        stopWalkthrough,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  )
}
