'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/pricing'
import { squareStatusLabel, type SquareInvoiceCandidate } from '@/lib/square/link'

interface LinkSquareInvoiceDialogProps {
  invoiceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked?: () => void
}

/**
 * Picker for linking a Square invoice that was created directly in the Square
 * Dashboard. Suggested matches (same amount, or the client's known Square
 * customer) come back first from the candidates API.
 */
export function LinkSquareInvoiceDialog({
  invoiceId,
  open,
  onOpenChange,
  onLinked,
}: LinkSquareInvoiceDialogProps) {
  const [candidates, setCandidates] = useState<SquareInvoiceCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const loadCandidates = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch(`/api/square/invoices/candidates/?invoiceId=${invoiceId}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load Square invoices')
      }
      setCandidates(data.candidates ?? [])
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load Square invoices')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedId(null)
      loadCandidates()
    }
  }, [open, loadCandidates])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return candidates
    return candidates.filter((candidate) =>
      [candidate.invoiceNumber, candidate.customerName, candidate.customerEmail, candidate.title]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    )
  }, [candidates, search])

  async function linkSelected() {
    if (!selectedId) return
    setLinking(true)
    const request = fetch(`/api/invoices/${invoiceId}/square/link/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ squareInvoiceId: selectedId }),
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Square invoice')
      }
      return data as { status: string }
    })

    toast.promise(request, {
      loading: 'Linking Square invoice…',
      success: (data) =>
        data.status === 'paid'
          ? 'Square invoice linked — it is already paid, so this invoice is now marked paid'
          : 'Square invoice linked — payment updates will now sync automatically',
      error: (error) => (error instanceof Error ? error.message : 'Failed to link Square invoice'),
    })

    try {
      await request
      onOpenChange(false)
      onLinked?.()
    } catch {
      // toast.promise already surfaced the failure
    } finally {
      setLinking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link Square Invoice</DialogTitle>
          <DialogDescription>
            Connect an invoice created in your Square Dashboard. Once linked, sent and paid
            updates from Square appear here automatically.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Loading Square invoices…</span>
          </div>
        ) : loadError ? (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadCandidates}>
              Try Again
            </Button>
          </div>
        ) : candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No unlinked Square invoices found. Invoices already linked here, or canceled in
            Square, are not shown.
          </p>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Search by number, customer, or title…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="max-h-80 space-y-1 overflow-y-auto pr-1" role="listbox" aria-label="Square invoices">
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No matches for “{search}”.</p>
              )}
              {filtered.map((candidate) => {
                const selected = candidate.id === selectedId
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setSelectedId(selected ? null : candidate.id)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {candidate.invoiceNumber ? `#${candidate.invoiceNumber}` : 'No number'}
                          </span>
                          {candidate.suggested && (
                            <Badge variant="secondary" className="text-xs">
                              Suggested
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {candidate.customerName || candidate.customerEmail || candidate.title || 'Unknown customer'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium">
                          {candidate.amount != null ? formatCurrency(candidate.amount) : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {squareStatusLabel(candidate.status)}
                          {candidate.createdAt
                            ? ` · ${new Date(candidate.createdAt).toLocaleDateString()}`
                            : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={linking}>
            Cancel
          </Button>
          <Button onClick={linkSelected} disabled={!selectedId || linking || loading}>
            {linking ? 'Linking…' : 'Link Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
