'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'
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

  const { user, organization, isOwner } = useOrganization()

  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

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
          setOpen(false)
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
      setOpen(!done)
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
  }, [stepIndex, upsertProgress])

  const handleComplete = useCallback(async () => {
    await upsertProgress({
      step: OWNER_ONBOARDING_STEPS.length - 1,
      completed_at: new Date().toISOString(),
      skipped_at: null,
    })
    setOpen(false)
  }, [upsertProgress])

  if (!ready || !isOwner) return null

  return (
    <OwnerOnboardingWizard
      open={open}
      onOpenChange={handleOpenChange}
      stepIndex={stepIndex}
      onStepIndexChange={handleStepIndexChange}
      onNavigate={handleNavigate}
      onSkip={handleSkip}
      onComplete={handleComplete}
    />
  )
}


