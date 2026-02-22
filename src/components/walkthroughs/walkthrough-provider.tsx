'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
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

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeWalkthrough, setActiveWalkthrough] = useState<Walkthrough | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const driverRef = useRef<Driver | null>(null)

  const startWalkthrough = useCallback((id: string) => {
    const walkthrough = getWalkthroughById(id)
    if (!walkthrough) return

    setActiveWalkthrough(walkthrough)
    setStepIndex(0)

    // Navigate to the first step's page if needed
    const firstStep = walkthrough.steps[0]
    if (firstStep.href && !pathname.startsWith(firstStep.href)) {
      router.push(firstStep.href)
    }

    // Small delay to let navigation settle before highlighting
    setTimeout(() => {
      const driverInstance = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'black',
        stagePadding: 8,
        stageRadius: 8,
        popoverClass: 'mca-walkthrough-popover',
        steps: walkthrough.steps.map((step, i) => ({
          element: step.element || undefined,
          popover: {
            title: step.title,
            description: step.description,
            side: 'bottom' as const,
            align: 'center' as const,
          },
          onHighlightStarted: () => {
            setStepIndex(i)
            // Navigate if this step is on a different page
            if (step.href && !window.location.pathname.startsWith(step.href)) {
              router.push(step.href)
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
    if (driverRef.current) {
      driverRef.current.destroy()
    }
    setActiveWalkthrough(null)
    setStepIndex(0)
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
