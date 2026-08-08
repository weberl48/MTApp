'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { BoundaryErrorReporter } from '@/components/errors/boundary-reporter'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Card className="max-w-md mx-auto">
      {/* No "Report this" button here: filing a report needs a session, and the
          person looking at this screen is by definition failing to get one. The
          error is still recorded — /api/errors/ just 401s for an anonymous
          caller, which is the intended outcome. */}
      <BoundaryErrorReporter error={error} boundary="auth" />
      <CardHeader className="text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-2">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle>Something went wrong</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} variant="outline" className="w-full">
          Try again
        </Button>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Reference: {error.digest}</p>
        )}
      </CardContent>
    </Card>
  )
}
