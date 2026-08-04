import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = "This section couldn't load. Your data is safe.",
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn('text-center py-12', className)}>
      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-destructive-soft text-destructive-soft-foreground">
        <AlertCircle aria-hidden="true" className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
