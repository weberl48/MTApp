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

export type OwnerOnboardingStep = {
  title: string
  description: string
  ctaLabel: string
  href: string
}

export const OWNER_ONBOARDING_WIZARD_KEY = 'owner_v1'

export const OWNER_ONBOARDING_STEPS: OwnerOnboardingStep[] = [
  {
    title: 'Welcome to May Creative Arts',
    description:
      'This quick setup will walk you through the main areas of the app so you can start managing clients, sessions, and invoices with confidence.',
    ctaLabel: 'Go to Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Invite your team',
    description:
      'Invite contractors so they can log sessions. You can copy an invite link from Settings → Team.',
    ctaLabel: 'Open Settings',
    href: '/settings',
  },
  {
    title: 'Add your first client',
    description:
      'Clients power everything else: sessions, invoices, portal access, and goals.',
    ctaLabel: 'Open Clients',
    href: '/clients',
  },
  {
    title: 'Configure service types',
    description:
      'Service Types define pricing, MCA cut, caps, and location. You can add or edit them from Settings → Services.',
    ctaLabel: 'Open Services',
    href: '/settings',
  },
  {
    title: 'Log a session and generate invoices',
    description:
      'Create a new session, add attendees, and submit. Invoices can be reviewed and sent from the Invoices section.',
    ctaLabel: 'Create a Session',
    href: '/sessions/new',
  },
  {
    title: 'Review invoices',
    description:
      'Track invoice status (pending/sent/paid), send invoices, and manage payments and reconciliation.',
    ctaLabel: 'Open Invoices',
    href: '/invoices',
  },
]

export function OwnerOnboardingWizard(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stepIndex: number
  onStepIndexChange: (stepIndex: number) => void
  onNavigate: (href: string) => void
  onSkip: () => void
  onComplete: () => void
}) {
  const steps = OWNER_ONBOARDING_STEPS
  const safeStepIndex = Math.min(Math.max(props.stepIndex, 0), steps.length - 1)
  const step = steps[safeStepIndex]
  const isFirst = safeStepIndex === 0
  const isLast = safeStepIndex === steps.length - 1

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
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
            <button
              type="button"
              className="text-sm underline underline-offset-4 hover:text-foreground"
              onClick={props.onSkip}
            >
              Skip for now
            </button>
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
            <Button onClick={() => props.onNavigate(step.href)} className="w-full">
              {step.ctaLabel}
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onOpenChange(false)}
          >
            Close
          </Button>

          <div className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isFirst}
              onClick={() => props.onStepIndexChange(safeStepIndex - 1)}
            >
              Back
            </Button>

            {isLast ? (
              <Button type="button" onClick={props.onComplete}>
                Finish
              </Button>
            ) : (
              <Button type="button" onClick={() => props.onStepIndexChange(safeStepIndex + 1)}>
                Next
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}







