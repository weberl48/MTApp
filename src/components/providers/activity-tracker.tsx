'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'

const ACTIVITY_KEY = 'mca_last_activity'
const CHECK_INTERVAL = 60000 // Check every minute

export function ActivityTracker({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { settings, user } = useOrganization()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get session timeout from settings (default 30 minutes)
  const timeoutMinutes = settings?.security?.session_timeout_minutes ?? 30

  const updateActivity = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString())
    }
  }, [])

  const checkActivity = useCallback(async () => {
    if (typeof window === 'undefined' || !user) return

    const lastActivity = localStorage.getItem(ACTIVITY_KEY)
    if (!lastActivity) {
      updateActivity()
      return
    }

    const lastActivityTime = parseInt(lastActivity, 10)
    const now = Date.now()
    const inactiveMinutes = (now - lastActivityTime) / (1000 * 60)

    if (inactiveMinutes >= timeoutMinutes) {
      // Session timed out - log out user
      const supabase = createClient()
      await supabase.auth.signOut()
      localStorage.removeItem(ACTIVITY_KEY)
      router.push('/login/?reason=timeout')
    }
  }, [timeoutMinutes, user, router, updateActivity])

  useEffect(() => {
    if (!user) return

    // Initialize activity timestamp
    updateActivity()

    // Set up activity listeners
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']

    const handleActivity = () => {
      updateActivity()
    }

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Check for timeout periodically
    timeoutRef.current = setInterval(checkActivity, CHECK_INTERVAL)

    // Also check on visibility change (when tab becomes visible again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkActivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, updateActivity, checkActivity])

  return <>{children}</>
}
