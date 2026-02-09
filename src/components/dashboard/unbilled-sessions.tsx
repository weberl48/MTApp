'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Receipt, Loader2, Plus } from 'lucide-react'
import { generateScholarshipBatchInvoice } from '@/app/actions/scholarship-invoices'
import { generateAllUnbilledScholarshipInvoices } from '@/app/actions/scholarship-invoices'
import {
  fetchUnbilledScholarshipSessions,
  groupUnbilledByClientMonth,
  type UnbilledGroup,
} from '@/lib/queries/scholarship'
import { toast } from 'sonner'
import Link from 'next/link'

interface Props {
  organizationId: string
}

export function UnbilledSessions({ organizationId }: Props) {
  const [groups, setGroups] = useState<UnbilledGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingKey, setGeneratingKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const unbilled = await fetchUnbilledScholarshipSessions(supabase)
      setGroups(groupUnbilledByClientMonth(unbilled))
      setLoading(false)
    }
    load()
  }, [])

  if (loading || groups.length === 0) return null

  const totalSessions = groups.reduce((sum, g) => sum + g.sessions.length, 0)

  function handleGenerateOne(group: UnbilledGroup) {
    const key = `${group.clientId}::${group.month}`
    setGeneratingKey(key)
    generateScholarshipBatchInvoice({
      clientId: group.clientId,
      billingPeriod: group.month,
      organizationId,
    }).then((result) => {
      setGeneratingKey(null)
      if (result.success) {
        toast.success(`Invoice generated for ${group.clientName}`)
        setGroups((prev) => prev.filter((g) => `${g.clientId}::${g.month}` !== key))
      } else {
        toast.error(result.error || 'Failed to generate invoice')
      }
    })
  }

  function handleGenerateAll() {
    startTransition(async () => {
      const result = await generateAllUnbilledScholarshipInvoices(organizationId)
      if (result.success) {
        if (result.generated > 0) {
          toast.success(`Generated ${result.generated} scholarship invoice${result.generated !== 1 ? 's' : ''}`)
        }
        if (result.failed.length > 0) {
          toast.warning(`${result.failed.length} failed: ${result.failed[0]}`)
        }
        setGroups([])
      }
    })
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            <CardTitle>Unbilled Scholarship Sessions</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleGenerateAll}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Generate All ({groups.length})
            </Button>
            <Link href="/invoices?tab=scholarship">
              <Button variant="outline" size="sm">View Details</Button>
            </Link>
          </div>
        </div>
        <CardDescription>
          {totalSessions} session{totalSessions !== 1 ? 's' : ''} across {groups.length} client{groups.length !== 1 ? 's' : ''}/month{groups.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {groups.map((group) => {
            const key = `${group.clientId}::${group.month}`
            const monthLabel = new Date(group.month + '-01').toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })
            const isGenerating = generatingKey === key

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-purple-50/50 dark:bg-purple-950/10 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{group.clientName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {monthLabel} &middot; {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={isGenerating || isPending}
                  onClick={() => handleGenerateOne(group)}
                >
                  {isGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
