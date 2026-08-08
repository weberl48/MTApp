'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
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
import { ChevronDown } from 'lucide-react'
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

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const reducedMotionSnapshot = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Tweens currency changes over ~150ms; renders the target directly under reduced motion. */
function AnimatedCurrency({ value }: { value: number }) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => true)
  const [shown, setShown] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (reduced || from === value) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 150)
      setShown(from + (value - from) * p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])

  return <>{formatCurrency(reduced ? value : shown)}</>
}

/**
 * "Price a session" — a live what-if calculator that names which tier of the
 * contractor-pay priority chain produced the number, and flags caps when they clamp it.
 * Pure input assembly lives in `src/lib/pricing/simulate.ts`; this component only
 * gathers inputs and renders the result. Collapsed to a one-line summary below `lg`
 * so the rate tables stay within reach on phones.
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
  const [expanded, setExpanded] = useState(false)

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

  // Who-gets-what split. Hidden when the shares don't describe the total (no-show
  // fees can leave MCA negative; a $0 total has no shares to show).
  const showSplit =
    result.totalAmount > 0 && result.contractorPay >= 0 && result.mcaCut >= 0
  const contractorPct = showSplit
    ? Math.min(100, (result.contractorPay / result.totalAmount) * 100)
    : 0
  const mcaPct = showSplit
    ? Math.min(100 - contractorPct, (result.mcaCut / result.totalAmount) * 100)
    : 0

  return (
    <Card data-tour="pricing-simulator">
      <CardHeader className="space-y-1">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left lg:pointer-events-none"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls="simulator-body"
        >
          <CardTitle>Price a session</CardTitle>
          <ChevronDown
            aria-hidden="true"
            className={`w-4 h-4 text-muted-foreground lg:hidden transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        {!expanded && (
          <p className="text-sm text-muted-foreground lg:hidden">
            Total {formatCurrency(result.totalAmount)} · Contractor{' '}
            {formatCurrency(result.contractorPay)} · MCA {formatCurrency(result.mcaCut)}
          </p>
        )}
      </CardHeader>
      <CardContent
        id="simulator-body"
        className={`space-y-4 ${expanded ? '' : 'hidden lg:block'}`}
      >
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
            <span className="font-medium tabular-nums">
              <AnimatedCurrency value={result.totalAmount} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Per person</span>
            <span className="tabular-nums">
              <AnimatedCurrency value={result.perPersonCost} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Contractor pay</span>
            <span className="tabular-nums">
              <AnimatedCurrency value={result.contractorPay} />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">MCA cut</span>
            <span className="tabular-nums">
              <AnimatedCurrency value={result.mcaCut} />
            </span>
          </div>
          {!!result.scholarshipDiscount && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scholarship discount</span>
              <span className="tabular-nums">
                <AnimatedCurrency value={result.scholarshipDiscount} />
              </span>
            </div>
          )}
        </div>

        {showSplit && (
          <div className="space-y-1.5">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${contractorPct}%` }}
              />
              <div
                className="bg-muted-foreground/30 transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${mcaPct}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-primary" />
                Contractor {Math.round(contractorPct)}%
              </span>
              <span className="flex items-center gap-1">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                MCA {Math.round(mcaPct)}%
              </span>
            </div>
          </div>
        )}

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
