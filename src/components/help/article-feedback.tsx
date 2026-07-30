'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/contexts/organization-context'
import { logArticleFeedback } from '@/lib/help/events'

/** "Was this helpful?" vote at the bottom of a help article. One vote per mount. */
export function ArticleFeedback({ slug }: { slug: string }) {
  const { organization, user } = useOrganization()
  const [voted, setVoted] = useState(false)

  if (!organization || !user) return null

  if (voted) {
    return (
      <p className="text-sm text-muted-foreground">Thanks for the feedback!</p>
    )
  }

  const vote = (helpful: boolean) => {
    logArticleFeedback(organization.id, user.id, slug, helpful)
    setVoted(true)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Yes, this helped"
        onClick={() => vote(true)}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="No, this didn't help"
        onClick={() => vote(false)}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
