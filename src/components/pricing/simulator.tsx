'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/pricing'
import { simulate, isGroupService, scholarshipLocked, PAY_SOURCE_LABELS } from '@/lib/pricing/simulate'
import { resolveDurationOptions } from '@/lib/settings/input'
import { useOrganization } from '@/contexts/organization-context'
import type { ServiceType } from '@/types/database'

export interface SimulatorProps {
  /** Active services only. */
  serviceTypes: ServiceType[]
  contractors: { id: string; name: string | null }[]
  /** Keyed `${contractorId}:${serviceTypeId}` — the hub's loaded `contractor_rates`. */
  rates: Map<string, { contractor_pay: number; duration_increment: number | null }>
}

/** No contractor selected — price via the service's own schedule/formula. */
const DEFAULT_CONTRACTOR = 'default'

/**
 * "Price a session" — a live what-if calculator that names which tier of the
 * contractor-pay priority chain produced the number, and flags caps when they clamp it.
 * Pure input assembly lives in `src/lib/pricing/simulate.ts`; this component only
 * gathers inputs and renders the result.
 */
export function Simulator({ serviceTypes, contractors, rates }: SimulatorProps) {
  const { settings } = useOrganization()
  const durations = resolveDurationOptions(settings?.session?.duration_options)

  const [serviceTypeId, setServiceTypeId] = useState('')
  const [contractorId, setContractorId] = useState(DEFAULT_CONTRACTOR)
  const [duration, setDuration] = useState(settings?.session?.default_duration ?? 30)
  const [headcount, setHeadcount] = useState(2)
  const [scholarship, setScholarship] = useState(false)
  const [noShow, setNoShow] = useState(false)

  // Service types load asynchronously on the hub page — derive the selection so
  // the first service becomes the default the moment the list arrives.
  const serviceType = serviceTypes.find((st) => st.id === serviceTypeId) ?? serviceTypes[0]

  if (!serviceType) {
    return (
      <Card data-tour="pricing-simulator">
        <CardHeader>
          <CardTitle>Price a session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add a service to price a session.</p>
        </CardContent>
      </Card>
    )
  }

  const locked = scholarshipLocked(serviceType)
  const isGroup = isGroupService(serviceType)

  const rateEntry =
    contractorId !== DEFAULT_CONTRACTOR ? rates.get(`${contractorId}:${serviceType.id}`) : undefined
  const contractorOverrides = rateEntry
    ? { customContractorPay: rateEntry.contractor_pay, durationIncrement: rateEntry.duration_increment }
    : undefined

  const result = simulate(
    {
      serviceType,
      headcount,
      durationMinutes: duration,
      contractorOverrides,
      scholarship,
      noShow,
    },
    settings
  )

  return (
    <Card data-tour="pricing-simulator">
      <CardHeader>
        <CardTitle>Price a session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sim_service">Service</Label>
          <Select value={serviceType.id} onValueChange={setServiceTypeId}>
            <SelectTrigger id="sim_service" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sim_contractor">Contractor</Label>
          <Select value={contractorId} onValueChange={setContractorId}>
            <SelectTrigger id="sim_contractor" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_CONTRACTOR}>Default (schedule/formula)</SelectItem>
              {contractors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name || 'Unnamed'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sim_duration">Duration</Label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <SelectTrigger id="sim_duration" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durations.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isGroup && (
          <div className="space-y-2">
            <Label htmlFor="sim_headcount">Headcount</Label>
            <Input
              id="sim_headcount"
              type="number"
              min="1"
              value={headcount}
              onChange={(e) => setHeadcount(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="sim_scholarship">Scholarship pricing</Label>
          <Switch
            id="sim_scholarship"
            checked={scholarship || locked}
            disabled={locked}
            onCheckedChange={setScholarship}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sim_no_show">No-show</Label>
          <Switch id="sim_no_show" checked={noShow} onCheckedChange={setNoShow} />
        </div>

        <Separator />

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatCurrency(result.totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Per person</span>
            <span>{formatCurrency(result.perPersonCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Contractor pay</span>
            <span>{formatCurrency(result.contractorPay)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">MCA cut</span>
            <span>{formatCurrency(result.mcaCut)}</span>
          </div>
          {!!result.scholarshipDiscount && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scholarship discount</span>
              <span>{formatCurrency(result.scholarshipDiscount)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {result.contractorPaySource && (
            <Badge variant="outline">{PAY_SOURCE_LABELS[result.contractorPaySource]}</Badge>
          )}
          {result.contractorCapApplied && <Badge variant="outline">Contractor cap applied</Badge>}
          {result.totalCapApplied && <Badge variant="outline">Total cap applied</Badge>}
          {result.appliedNoShowFee != null && (
            <Badge variant="outline">No-show fee {formatCurrency(result.appliedNoShowFee)}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
