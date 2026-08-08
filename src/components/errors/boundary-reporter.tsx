'use client'

import { useEffect } from 'react'
import { clientErrorBuffer } from '@/lib/errors/client-buffer'

/**
 * Reports a crash caught by a React error boundary.
 *
 * Boundaries were previously silent, which meant the single most severe class of
 * frontend failure — the one that blanks the page — was the one we never heard
 * about. `window.onerror` does not help here: a boundary catching the error is
 * precisely what stops it reaching the global handler, so the report has to be
 * made explicitly.
 *
 * The `digest` is React's server-side error hash. It is the only thing that ties
 * this crash to the corresponding server log line, so it goes in the message.
 *
 * Fire-and-forget, once per mount. Renders nothing.
 */
export function BoundaryErrorReporter({
  error,
  boundary,
}: {
  error: Error & { digest?: string }
  boundary: string
}) {
  useEffect(() => {
    const message = [
      `[${boundary} boundary]`,
      error.message || 'Unknown error',
      error.digest ? `(digest ${error.digest})` : '',
    ]
      .filter(Boolean)
      .join(' ')

    clientErrorBuffer.record(error.name || 'Error', message)

    const endpoint =
      process.env.NODE_ENV === 'development' ? '/api/dev/errors/' : '/api/errors/'

    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'frontend',
        kind: `boundary:${boundary}`,
        message,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
      keepalive: true,
    }).catch(() => {
      // A crash report that fails must not produce a second crash.
    })
    // Report once for this error instance; `reset()` remounts with a new one.
  }, [error, boundary])

  return null
}
