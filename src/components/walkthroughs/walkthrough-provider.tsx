'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { Walkthrough } from './walkthrough-types'
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

/**
 * Scroll an element into view within its nearest scrollable ancestor.
 * Standard scrollIntoView scrolls the whole page; this scrolls the
 * dialog/overflow container so the field is visible.
 */
function scrollElementIntoView(el: Element) {
  // Find the closest scrollable parent (e.g., the dialog content)
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

    // Navigate to the first step's page if needed
    const firstStep = walkthrough.steps[0]
    if (firstStep.href && !pathname.startsWith(hrefPathname(firstStep.href))) {
      router.push(firstStep.href)
    }

    // Small delay to let navigation settle before highlighting
    timeoutRef.current = setTimeout(() => {
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
        steps: walkthrough.steps.map((step, i) => ({
          element: step.element || undefined,
          popover: {
            title: step.title,
            description: step.description,
            side: step.popoverSide || ('bottom' as const),
            align: 'center' as const,
            showButtons: ['next', 'previous', 'close'] as const,
          },
          onHighlightStarted: () => {
            setStepIndex(i)
            // Navigate if this step requires a different URL
            if (step.href) {
              const currentUrl = window.location.pathname + window.location.search
              const stepPath = hrefPathname(step.href)
              const needsNavigation = !window.location.pathname.startsWith(stepPath)
                || (step.href.includes('?') && !currentUrl.includes(step.href.split('?')[1]))
              if (needsNavigation) {
                router.push(step.href)
              }
            }

            // Scroll the target element into view within its scrollable container
            if (step.element) {
              requestAnimationFrame(() => {
                const el = document.querySelector(step.element!)
                if (el) scrollElementIntoView(el)
              })
            }
          },
        })),
        onDestroyed: () => {
          setActiveWalkthrough(null)
          setStepIndex(0)
          driverRef.current = null
        },
      })

      driverRef.current = driverInstance
      driverInstance.drive()
    }, 300)
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
