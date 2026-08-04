import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Catch-all for unknown paths under a portal token. Without it, a mistyped or stale
 * portal URL fell through to the app's global not-found page, whose "Go to Dashboard" /
 * "Sign In" buttons are dead ends for a client with no staff account. Named routes
 * (sessions, goals, resources) always win over this catch-all.
 */
export default async function PortalNotFound({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
          <FileQuestion aria-hidden="true" className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          That page doesn&apos;t exist in your portal. Your link still works — head back to
          your portal home to see your sessions, goals, and resources.
        </p>
        <Button asChild className="w-full">
          <Link href={`/portal/${token}/`}>Back to My Portal</Link>
        </Button>
      </div>
    </div>
  )
}
