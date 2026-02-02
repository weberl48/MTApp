'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Walkthrough } from './walkthrough-types'

type WalkthroughDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  walkthrough: Walkthrough
  stepIndex: number
  onStepIndexChange: (stepIndex: number) => void
  onNavigate: (href: string) => void
  onComplete: () => void
}

export function WalkthroughDialog({
  open,
  onOpenChange,
  walkthrough,
  stepIndex,
  onStepIndexChange,
  onNavigate,
  onComplete,
}: WalkthroughDialogProps) {
  const steps = walkthrough.steps
  const safeStepIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1)
  const step = steps[safeStepIndex]
  const isFirst = safeStepIndex === 0
  const isLast = safeStepIndex === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>{step.title}</DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Step {safeStepIndex + 1} of {steps.length}
            </span>
            <span className="font-medium text-foreground">{walkthrough.name}</span>
          </div>

          <div className="flex gap-1" aria-hidden>
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'h-1.5 flex-1 rounded-full bg-muted',
                  idx <= safeStepIndex && 'bg-primary'
                )}
              />
            ))}
          </div>

          <div className="pt-2">
            <Button onClick={() => onNavigate(step.href)} className="w-full">
              {step.ctaLabel}
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>

          <div className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isFirst}
              onClick={() => onStepIndexChange(safeStepIndex - 1)}
            >
              Back
            </Button>

            {isLast ? (
              <Button type="button" onClick={onComplete}>
                Finish
              </Button>
            ) : (
              <Button type="button" onClick={() => onStepIndexChange(safeStepIndex + 1)}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
