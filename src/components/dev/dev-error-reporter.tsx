'use client'

import { useEffect } from 'react'
import { createReportGate, consoleArgsToMessage, type DevErrorPayload } from '@/lib/dev/error-report'

/**
 * Dev-only: forwards browser errors (window errors, unhandled rejections,
 * console.error) to the local dev portal via the same-origin /api/dev/errors/
 * route (the CSP connect-src blocks posting to the portal's port directly).
 * Renders nothing; inert outside development.
 */
export function DevErrorReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const shouldReport = createReportGate()

    const post = (payload: DevErrorPayload) => {
      if (!shouldReport(`${payload.kind}:${payload.message}`)) return
      fetch('/api/dev/errors/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Portal not running — stay silent.
      })
    }

    const onError = (event: ErrorEvent) => {
      post({
        source: 'frontend',
        kind: 'window.onerror',
        message: event.message || 'Unknown error',
        stack: event.error instanceof Error ? event.error.stack : undefined,
        url: window.location.href,
      })
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      post({
        source: 'frontend',
        kind: 'unhandledrejection',
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        url: window.location.href,
      })
    }

    const originalConsoleError = console.error
    console.error = (...args: unknown[]) => {
      originalConsoleError(...args)
      try {
        post({
          source: 'frontend',
          kind: 'console.error',
          message: consoleArgsToMessage(args),
          url: window.location.href,
        })
      } catch {
        // Never let reporting break the console.
      }
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      console.error = originalConsoleError
    }
  }, [])

  return null
}
