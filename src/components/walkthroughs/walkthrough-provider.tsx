'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Walkthrough } from './walkthrough-types'
import { getWalkthroughById } from './walkthroughs'
import { WalkthroughDialog } from './walkthrough-dialog'

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
  const [activeWalkthrough, setActiveWalkthrough] = useState<Walkthrough | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const startWalkthrough = useCallback((id: string) => {
    const walkthrough = getWalkthroughById(id)
    if (walkthrough) {
      setActiveWalkthrough(walkthrough)
      setStepIndex(0)
      setOpen(true)
    }
  }, [])

  const stopWalkthrough = useCallback(() => {
    setOpen(false)
    setActiveWalkthrough(null)
    setStepIndex(0)
  }, [])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setActiveWalkthrough(null)
      setStepIndex(0)
    }
  }, [])

  const handleStepIndexChange = useCallback((nextIndex: number) => {
    if (!activeWalkthrough) return
    const clamped = Math.min(Math.max(nextIndex, 0), activeWalkthrough.steps.length - 1)
    setStepIndex(clamped)
  }, [activeWalkthrough])

  const handleNavigate = useCallback((href: string) => {
    router.push(href)
  }, [router])

  const handleComplete = useCallback(() => {
    setOpen(false)
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
      {activeWalkthrough && (
        <WalkthroughDialog
          open={open}
          onOpenChange={handleOpenChange}
          walkthrough={activeWalkthrough}
          stepIndex={stepIndex}
          onStepIndexChange={handleStepIndexChange}
          onNavigate={handleNavigate}
          onComplete={handleComplete}
        />
      )}
    </WalkthroughContext.Provider>
  )
}
