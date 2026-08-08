'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Bug } from 'lucide-react'
import { BoundaryErrorReporter } from '@/components/errors/boundary-reporter'
import { BugReportDialog } from '@/components/bug-report/bug-report-dialog'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <BoundaryErrorReporter error={error} boundary="dashboard" />

      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm text-center max-w-md">
        An unexpected error occurred. It&apos;s already been logged — you can add what you were
        doing to help us fix it faster.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button onClick={() => setReportOpen(true)} variant="secondary" className="gap-2">
          <Bug className="h-4 w-4" />
          Report this
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">Reference: {error.digest}</p>
      )}

      {/* Pre-filled so a report is useful even if the user adds nothing: the
          digest is what ties this crash to its server log line. */}
      <BugReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        prefill={
          error.digest
            ? `The page crashed (reference ${error.digest}). I was trying to `
            : 'The page crashed. I was trying to '
        }
      />
    </div>
  )
}
