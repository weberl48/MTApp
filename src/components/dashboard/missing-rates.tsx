'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface MissingRate {
  contractorId: string
  contractorName: string
  serviceTypeName: string
}

export function MissingRates() {
  const [missing, setMissing] = useState<MissingRate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [
        { data: contractors },
        { data: serviceTypes },
        { data: rates },
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id, name')
          .eq('role', 'contractor'),
        supabase
          .from('service_types')
          .select('id, name')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('contractor_rates')
          .select('contractor_id, service_type_id'),
      ])

      if (!contractors || !serviceTypes) {
        setLoading(false)
        return
      }

      // Build a set of existing rate keys for fast lookup
      const existingRates = new Set(
        (rates || []).map((r) => `${r.contractor_id}:${r.service_type_id}`)
      )

      // Find all missing combinations
      const gaps: MissingRate[] = []
      for (const contractor of contractors) {
        for (const st of serviceTypes) {
          if (!existingRates.has(`${contractor.id}:${st.id}`)) {
            gaps.push({
              contractorId: contractor.id,
              contractorName: contractor.name,
              serviceTypeName: st.name,
            })
          }
        }
      }

      setMissing(gaps)
      setLoading(false)
    }
    load()
  }, [])

  if (loading || missing.length === 0) return null

  // Group by contractor for cleaner display
  const byContractor = new Map<string, { name: string; id: string; serviceTypes: string[] }>()
  for (const m of missing) {
    const existing = byContractor.get(m.contractorId)
    if (existing) {
      existing.serviceTypes.push(m.serviceTypeName)
    } else {
      byContractor.set(m.contractorId, {
        name: m.contractorName,
        id: m.contractorId,
        serviceTypes: [m.serviceTypeName],
      })
    }
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <CardTitle>Missing Contractor Rates</CardTitle>
          </div>
          <Link href="/team/">
            <Button variant="outline" size="sm">Team &gt; Rates</Button>
          </Link>
        </div>
        <CardDescription>
          {missing.length} rate{missing.length !== 1 ? 's' : ''} not configured — contractors cannot log sessions for these service types
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {Array.from(byContractor.values()).map((contractor) => (
            <Link
              key={contractor.id}
              href={`/team/${contractor.id}/`}
              className="block p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              <div className="font-medium text-sm">{contractor.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Missing: {contractor.serviceTypes.join(', ')}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
