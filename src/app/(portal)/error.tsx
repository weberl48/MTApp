'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { BoundaryErrorReporter } from '@/components/errors/boundary-reporter'

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      {/* Portal visitors are clients on a token link, not staff — they get no
          report button, and the ingest route will reject the anonymous POST.
          The attempt costs nothing and catches the case where a staff member is
          previewing the portal while signed in. */}
      <BoundaryErrorReporter error={error} boundary="portal" />
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm text-center max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">Reference: {error.digest}</p>
      )}
    </div>
  )
}
