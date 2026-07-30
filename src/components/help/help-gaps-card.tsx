'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SearchX, ThumbsDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOrganization } from '@/contexts/organization-context'
import { createClient } from '@/lib/supabase/client'
import { getArticleBySlug } from '@/app/(dashboard)/help/_data/help-articles'

type HelpEventRow = {
  event_type: 'search_miss' | 'article_feedback'
  query: string | null
  article_slug: string | null
  helpful: boolean | null
  created_at: string
}

/** Owner-facing worklist: what people searched for and didn't find, and which
 *  articles got a thumbs-down. Renders nothing for non-admins or when empty. */
export function HelpGapsCard() {
  const { organization, can } = useOrganization()
  const [rows, setRows] = useState<HelpEventRow[] | null>(null)

  const allowed = can('settings:edit')
  const orgId = organization?.id

  useEffect(() => {
    if (!allowed || !orgId) return
    let cancelled = false
    createClient()
      .from('help_events')
      .select('event_type, query, article_slug, helpful, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setRows(data as HelpEventRow[])
      })
    return () => {
      cancelled = true
    }
  }, [allowed, orgId])

  if (!allowed || !rows) return null

  const misses: string[] = []
  for (const row of rows) {
    if (row.event_type === 'search_miss' && row.query && !misses.includes(row.query)) {
      misses.push(row.query)
    }
  }
  const unhelpful = rows
    .filter(r => r.event_type === 'article_feedback' && r.helpful === false && r.article_slug)
    .slice(0, 5)

  if (misses.length === 0 && unhelpful.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Help gaps</CardTitle>
        <CardDescription>
          Searches that found nothing and articles voted not helpful — candidates for new content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {misses.length > 0 && (
          <div>
            <p className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
              <SearchX className="h-4 w-4 text-muted-foreground" />
              Unanswered searches
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {misses.slice(0, 10).map(q => (
                <li key={q}>&ldquo;{q}&rdquo;</li>
              ))}
            </ul>
          </div>
        )}
        {unhelpful.length > 0 && (
          <div>
            <p className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
              <ThumbsDown className="h-4 w-4 text-muted-foreground" />
              Voted not helpful
            </p>
            <ul className="text-sm space-y-1">
              {unhelpful.map((r, i) => {
                const article = getArticleBySlug(r.article_slug!)
                return (
                  <li key={`${r.article_slug}-${i}`}>
                    {article ? (
                      <Link href={`/help/${article.slug}/`} className="text-primary hover:underline">
                        {article.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{r.article_slug}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
