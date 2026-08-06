'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWalkthrough, useWalkthroughAudienceFlags } from '@/components/walkthroughs/walkthrough-provider'
import { canStartWalkthrough, getWalkthroughById } from '@/components/walkthroughs/walkthroughs'
import { useOrganization } from '@/contexts/organization-context'
import {
  RECOMMENDED_WALKTHROUGH_ORDER,
  WALKTHROUGHS_CHANGED_EVENT,
  getCompletedWalkthroughs,
} from '@/lib/walkthroughs/completion'

/**
 * Interactive tour list in recommended onboarding order, with per-browser
 * completion checkmarks. Each tour's audience decides who sees it (admin,
 * owner, contractor, or everyone).
 */
export function GuidedToursCard() {
  const { startWalkthrough } = useWalkthrough()
  const flags = useWalkthroughAudienceFlags()
  const { organization } = useOrganization()
  // Read after mount: localStorage isn't available during SSR/hydration.
  const [completed, setCompleted] = useState<string[]>([])
  useEffect(() => {
    const refresh = () => setCompleted(getCompletedWalkthroughs())
    refresh()
    window.addEventListener(WALKTHROUGHS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(WALKTHROUGHS_CHANGED_EVENT, refresh)
  }, [])

  const tours = RECOMMENDED_WALKTHROUGH_ORDER
    .map(id => getWalkthroughById(id))
    .filter((w): w is NonNullable<typeof w> => !!w && canStartWalkthrough(w.id, flags, organization?.settings))

  const doneCount = tours.filter(w => completed.includes(w.id)).length

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Guided tours</CardTitle>
        <CardDescription>
          Interactive walkthroughs that highlight each step on the real screens.
          New here? Take them in order — {doneCount} of {tours.length} done.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="divide-y">
          {tours.map((w, i) => {
            const done = completed.includes(w.id)
            return (
              <li key={w.id} className="flex items-center gap-3 py-2.5">
                {done ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
                    aria-label="Completed"
                  />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border text-xs text-muted-foreground flex items-center justify-center">
                    {i + 1}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{w.description}</p>
                </div>
                <Button
                  variant={done ? 'ghost' : 'outline'}
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => startWalkthrough(w.id)}
                >
                  <Play className="h-3.5 w-3.5" />
                  {done ? 'Retake' : 'Start'}
                </Button>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
