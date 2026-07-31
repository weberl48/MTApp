'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useOrganization } from '@/contexts/organization-context'
import { useWalkthrough } from './walkthrough-provider'
import { getCompletedWalkthroughs } from '@/lib/walkthroughs/completion'

/** Shown at most once per browser — a nag-free, one-shot invitation. */
const NUDGE_SHOWN_KEY = 'mca-walkthrough-nudge-shown'

/**
 * One-time first-visit nudge toward the App Overview tour, for users who
 * would otherwise only discover tours by opening the Help Center. Owners are
 * excluded — their onboarding wizard hands off to the tour on completion.
 */
export function WalkthroughNudge() {
  const { user, can } = useOrganization()
  const { startWalkthrough } = useWalkthrough()

  // The context recreates `can`/`startWalkthrough` identities on every provider
  // render, so depending on them would cancel the pending timeout on routine
  // re-renders. Read them through refs and key the effect on the stable user id.
  const canRef = useRef(can)
  const startRef = useRef(startWalkthrough)
  useEffect(() => {
    canRef.current = can
    startRef.current = startWalkthrough
  })
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    // All checks — and the one-shot flag write — happen INSIDE the delayed
    // callback: if the timer is cancelled (unmount, user switch) the nudge is
    // not consumed and simply re-arms on the next dashboard visit.
    const timeout = setTimeout(() => {
      if (canRef.current('settings:edit')) return
      try {
        if (window.localStorage.getItem(NUDGE_SHOWN_KEY)) return
        if (getCompletedWalkthroughs().length > 0) return
        window.localStorage.setItem(NUDGE_SHOWN_KEY, '1')
      } catch {
        return // storage unavailable — skip rather than nag on every visit
      }
      toast.info('New here?', {
        description: 'Take the two-minute App Overview tour to learn your way around.',
        action: { label: 'Start', onClick: () => startRef.current('app-overview') },
        duration: 15000,
      })
    }, 1500)
    return () => clearTimeout(timeout)
  }, [userId])

  return null
}
