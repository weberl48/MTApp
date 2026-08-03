'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface PilotStatus {
  active: boolean
  recipients: string[]
}

/**
 * Full-width safety notice shown on every dashboard route while pilot mode
 * (`EMAIL_PILOT_REDIRECT_TO`) is redirecting client-facing email to internal
 * testers. Not dismissible — it should stay visible for as long as the app
 * is not actually reaching clients.
 */
export function PilotModeBanner() {
  const [status, setStatus] = useState<PilotStatus | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const res = await fetch('/api/pilot-status/')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setStatus(data)
      } catch {
        // Silently fail - banner just won't show
      }
    }
    fetchStatus()

    return () => {
      cancelled = true
    }
  }, [])

  if (!status || !status.active) return null

  return (
    <div
      role="status"
      className="flex items-start gap-3 px-4 py-3 sm:px-6 bg-amber-50 dark:bg-amber-950 border-b border-amber-300 dark:border-amber-800"
    >
      <AlertTriangle aria-hidden="true" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900 dark:text-amber-200">
        <p className="font-semibold">Pilot mode — clients are not receiving email.</p>
        <p className="mt-0.5">
          Invoices and reminders are being redirected to the testing inboxes.
          {status.recipients.length > 0 && (
            <> Recipients: {status.recipients.join(', ')}.</>
          )}
        </p>
        {status.recipients.length === 0 && (
          <p className="mt-0.5 font-bold">
            Warning: the pilot recipient list is misconfigured — sending will fail until it is fixed.
          </p>
        )}
      </div>
    </div>
  )
}
