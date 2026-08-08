'use client'

import { useEffect } from 'react'
import { createReportGate, consoleArgsToMessage, type ErrorReportPayload } from '@/lib/errors/report'
import { clientErrorBuffer } from '@/lib/errors/client-buffer'
import { isIgnorableClientError } from '@/lib/errors/noise'

/**
 * Captures browser errors — window errors, unhandled promise rejections, and
 * console.error — and does two things with each:
 *
 *  1. Feeds the session ring buffer, so a bug report filed a moment later can
 *     say what actually went wrong.
 *  2. Ships it to the server. In development that is /api/dev/errors/, which
 *     relays to the LAN dev portal; in production it is /api/errors/, which
 *     writes to `app_errors`. Both are same-origin because the CSP's
 *     connect-src forbids posting anywhere else.
 *
 * This used to be dev-only, which is exactly why production frontend crashes
 * were invisible. It renders nothing and must never throw: a reporter that
 * breaks the page it is reporting on is worse than no reporter.
 */
export function ErrorReporter() {
  useEffect(() => {
    const endpoint =
      process.env.NODE_ENV === 'development' ? '/api/dev/errors/' : '/api/errors/'

    const shouldReport = createReportGate()

    const post = (payload: ErrorReportPayload) => {
      // Framework/browser noise is dropped before it touches the buffer OR the
      // network. It is not an app signal, so putting it in a bug report would be
      // as misleading as putting it in the feed.
      if (isIgnorableClientError(payload.message)) return

      // The buffer is local and cheap, so it records every occurrence even when
      // the network gate suppresses the report — "this happened 40 times" is
      // precisely the signal a bug report wants.
      clientErrorBuffer.record(payload.kind, payload.message)

      if (!shouldReport(`${payload.kind}:${payload.message}`)) return
      fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Endpoint unreachable or portal not running — stay silent.
      })
    }

    const onError = (event: ErrorEvent) => {
      post({
        source: 'frontend',
        kind: event.error instanceof Error ? event.error.name : 'window.onerror',
        message: event.message || 'Unknown error',
        stack: event.error instanceof Error ? event.error.stack : undefined,
        url: window.location.href,
      })
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      post({
        source: 'frontend',
        kind: reason instanceof Error ? reason.name : 'unhandledrejection',
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
