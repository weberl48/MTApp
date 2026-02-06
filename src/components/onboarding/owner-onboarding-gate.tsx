'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
import { Button } from '@/components/ui/button'
import { HelpCircle, X } from 'lucide-react'
import {
  OWNER_ONBOARDING_STEPS,
  OWNER_ONBOARDING_WIZARD_KEY,
  OwnerOnboardingWizard,
} from './owner-onboarding-wizard'

type OnboardingRow = {
  step: number
  completed_at: string | null
  skipped_at: string | null
}

export function OwnerOnboardingGate() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const { user, organization, can } = useOrganization()
  const isOwner = can('settings:edit')

  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [showButton, setShowButton] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const userId = user?.id
  const organizationId = organization?.id

  const upsertProgress = useCallback(
    async (updates: Partial<{ step: number; completed_at: string | null; skipped_at: string | null }>) => {
      if (!userId || !organizationId) return

      const payload: Record<string, unknown> = {
        user_id: userId,
        organization_id: organizationId,
        wizard_key: OWNER_ONBOARDING_WIZARD_KEY,
        step: updates.step ?? stepIndex,
      }

      // Only send these when explicitly updating them; otherwise preserve existing values.
      if (updates.completed_at !== undefined) payload.completed_at = updates.completed_at
      if (updates.skipped_at !== undefined) payload.skipped_at = updates.skipped_at

      await supabase
        .from('user_onboarding')
        .upsert(
          payload,
          { onConflict: 'user_id,organization_id,wizard_key' }
        )
    },
    [organizationId, supabase, stepIndex, userId]
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!userId || !organizationId || !isOwner) {
        if (!cancelled) {
          setReady(true)
          setShowButton(false)
        }
        return
      }

      const { data } = await supabase
        .from('user_onboarding')
        .select('step, completed_at, skipped_at')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('wizard_key', OWNER_ONBOARDING_WIZARD_KEY)
        .maybeSingle()

      if (cancelled) return

      const row = (data as OnboardingRow | null) ?? null
      const done = Boolean(row?.completed_at || row?.skipped_at)
      setStepIndex(row?.step ?? 0)
      // Show the floating button instead of auto-opening the wizard
      setShowButton(!done)
      setReady(true)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isOwner, organizationId, supabase, userId])

  const handleOpenChange = useCallback(
    async (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (!nextOpen) {
        await upsertProgress({ step: stepIndex })
      }
    },
    [stepIndex, upsertProgress]
  )

  const handleStepIndexChange = useCallback(
    async (nextIndex: number) => {
      const clamped = Math.min(Math.max(nextIndex, 0), OWNER_ONBOARDING_STEPS.length - 1)
      setStepIndex(clamped)
      await upsertProgress({ step: clamped })
    },
    [upsertProgress]
  )

  const handleNavigate = useCallback(
    async (href: string) => {
      await upsertProgress({ step: stepIndex })
      setOpen(false)
      router.push(href)
    },
    [router, stepIndex, upsertProgress]
  )

  const handleSkip = useCallback(async () => {
    await upsertProgress({ step: stepIndex, skipped_at: new Date().toISOString() })
    setOpen(false)
    setShowButton(false)
  }, [stepIndex, upsertProgress])

  const handleComplete = useCallback(async () => {
    await upsertProgress({
      step: OWNER_ONBOARDING_STEPS.length - 1,
      completed_at: new Date().toISOString(),
      skipped_at: null,
    })
    setOpen(false)
    setShowButton(false)
  }, [upsertProgress])

  const handleDismissButton = useCallback(() => {
    setDismissed(true)
    setShowButton(false)
  }, [])

  const handleOpenWizard = useCallback(() => {
    setOpen(true)
  }, [])

  if (!ready || !isOwner) return null

  return (
    <>
      {/* Floating "Learn More" button - only shown when wizard hasn't been completed */}
      {showButton && !dismissed && !open && (
        <div className="fixed bottom-20 right-6 z-50 lg:bottom-6 flex items-center gap-2">
          <Button
            onClick={handleOpenWizard}
            className="animate-bounce shadow-lg hover:shadow-xl transition-shadow rounded-full h-12 px-4 gap-2"
            aria-label="Open getting started guide"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Need help getting started?</span>
            <span className="sm:hidden">Get Started</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismissButton}
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
            aria-label="Dismiss getting started button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <OwnerOnboardingWizard
        open={open}
        onOpenChange={handleOpenChange}
        stepIndex={stepIndex}
        onStepIndexChange={handleStepIndexChange}
        onNavigate={handleNavigate}
        onSkip={handleSkip}
        onComplete={handleComplete}
      />
    </>
  )
}







