'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/pricing'
import { parseLocalDate } from '@/lib/dates'
import { REPRICE_SKIP_LABELS } from '@/lib/pricing/reprice-eligibility'
import { repriceSessions, type RepriceResult } from '@/app/actions/reprice-sessions'
import { toast } from 'sonner'

interface RepriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionIds: string[]
  /** Called after a successful apply so the caller can refetch and clear its selection. */
  onApplied: () => void
}

/** One before → after money cell. Renders nothing but the value when it did not move. */
function Delta({ from, to }: { from: number; to: number }) {
  if (Math.round(from * 100) === Math.round(to * 100)) {
    return <span className="text-muted-foreground">{formatCurrency(to)}</span>
  }
  return (
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground line-through">{formatCurrency(from)}</span>
      <span aria-hidden="true"> → </span>
      <span className="sr-only"> changes to </span>
      <span className={`font-medium ${to < 0 ? 'text-warning' : ''}`}>{formatCurrency(to)}</span>
    </span>
  )
}

/**
 * Preview-then-confirm for a bulk re-price.
 *
 * Opening the dialog runs the action with `apply: false`, which writes nothing — the owner sees
 * every before → after before any money moves. This preview is the whole safety mechanism: a
 * mistyped rate is obvious here and invisible afterwards.
 */
export function RepriceDialog({ open, onOpenChange, sessionIds, onApplied }: RepriceDialogProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RepriceResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isApplying, startApply] = useTransition()

  useEffect(() => {
    if (!open) {
      setResults(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    repriceSessions(sessionIds, false)
      .then((response) => {
        if (cancelled) return
        if (!response.success) setError(response.error)
        else setResults(response.results)
      })
      .catch(() => {
        if (!cancelled) setError('Could not calculate the new pricing')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, sessionIds])

  const changing = results?.filter((r) => r.outcome === 'repriced') ?? []
  const unchanged = results?.filter((r) => r.outcome === 'unchanged') ?? []
  const skipped = results?.filter((r) => r.outcome === 'skipped') ?? []
  const errored = results?.filter((r) => r.outcome === 'error') ?? []

  function handleApply() {
    startApply(async () => {
      const response = await repriceSessions(sessionIds, true)
      if (!response.success) {
        toast.error(response.error)
        return
      }
      const applied = response.results.filter((r) => r.outcome === 'repriced').length
      const failed = response.results.filter((r) => r.outcome === 'error').length
      if (applied > 0) {
        toast.success(`Re-priced ${applied} session${applied === 1 ? '' : 's'}`)
      } else {
        toast.info('No sessions needed re-pricing')
      }
      if (failed > 0) toast.error(`${failed} session${failed === 1 ? '' : 's'} failed`)
      onApplied()
      onOpenChange(false)
    })
  }

  const label = (result: RepriceResult) =>
    `${result.serviceName}${result.date ? ` · ${parseLocalDate(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recalculate pricing</DialogTitle>
          <DialogDescription>
            Re-prices the selected sessions using your current service rates and contractor rates,
            and updates their unsent invoices to match. Nothing is saved until you confirm.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Calculating…
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {results && !loading && (
          <div className="max-h-[55vh] overflow-y-auto space-y-4">
            {changing.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  {changing.length} session{changing.length === 1 ? '' : 's'} will change
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground text-left">
                        <th className="py-1 pr-3 font-medium">Session</th>
                        <th className="py-1 pr-3 font-medium">Total</th>
                        <th className="py-1 pr-3 font-medium">MCA cut</th>
                        <th className="py-1 font-medium">Contractor pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changing.map((result) => (
                        <tr key={result.sessionId} className="border-t">
                          <td className="py-1.5 pr-3">{label(result)}</td>
                          <td className="py-1.5 pr-3">
                            {result.diff && <Delta {...result.diff.totalAmount} />}
                          </td>
                          <td className="py-1.5 pr-3">
                            {result.diff && <Delta {...result.diff.mcaCut} />}
                          </td>
                          <td className="py-1.5">
                            {result.diff && <Delta {...result.diff.contractorPay} />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {changing.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                Nothing to change — every eligible session already matches your current rates.
              </p>
            )}

            {unchanged.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {unchanged.length} session{unchanged.length === 1 ? '' : 's'} already correct.
              </p>
            )}

            {skipped.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">
                  {skipped.length} skipped
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {skipped.map((result) => (
                    <li key={result.sessionId}>
                      {label(result)} — {result.reason ? REPRICE_SKIP_LABELS[result.reason] : 'Not eligible'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errored.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1 text-destructive">
                  {errored.length} could not be read
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {errored.map((result) => (
                    <li key={result.sessionId}>
                      {label(result)} — {result.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading || isApplying || changing.length === 0}>
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Applying…
              </>
            ) : (
              `Apply to ${changing.length} session${changing.length === 1 ? '' : 's'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
