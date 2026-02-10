'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Send, Loader2, FileText } from 'lucide-react'
import { bulkUpdateInvoiceStatus } from '@/app/actions/invoices'
import { bulkSendInvoices } from '@/app/actions/invoices'
import { formatCurrency } from '@/lib/pricing'
import { paymentMethodLabels } from '@/lib/constants/display'
import { useOrganization } from '@/contexts/organization-context'
import { toast } from 'sonner'
import Link from 'next/link'

interface PendingInvoice {
  id: string
  amount: number
  payment_method: string
  client: { name: string; contact_email: string | null } | null
  session: { date: string; service_type: { name: string } | null } | null
  invoice_type: string
  billing_period: string | null
}

export function UnsentInvoices() {
  const [invoices, setInvoices] = useState<PendingInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const { can } = useOrganization()
  const canSend = can('invoice:send')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: queryError } = await supabase
        .from('invoices')
        .select(`
          id, amount, payment_method, invoice_type, billing_period,
          client:clients(name, contact_email),
          session:sessions(date, service_type:service_types(name))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)

      if (queryError) {
        setError('Failed to load unsent invoices')
      } else {
        setInvoices((data as unknown as PendingInvoice[]) || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading || error || invoices.length === 0) return null

  const total = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const allSelected = invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id))
  const selectedTotal = invoices
    .filter((inv) => selectedIds.has(inv.id))
    .reduce((sum, inv) => sum + inv.amount, 0)

  function handleMarkSent() {
    if (selectedIds.size === 0) return
    startTransition(async () => {
      const result = await bulkUpdateInvoiceStatus(Array.from(selectedIds), 'sent')
      if (result.success) {
        toast.success(`Marked ${selectedIds.size} invoice${selectedIds.size !== 1 ? 's' : ''} as sent`)
        setInvoices((prev) => prev.filter((inv) => !selectedIds.has(inv.id)))
        setSelectedIds(new Set())
      } else {
        toast.error('error' in result ? result.error : 'Failed to update invoices')
      }
    })
  }

  function handleSendEmails() {
    const emailableIds = invoices
      .filter((inv) => selectedIds.has(inv.id) && inv.client?.contact_email)
      .map((inv) => inv.id)

    if (emailableIds.length === 0) {
      toast.error('No selected invoices have client email addresses')
      return
    }

    startTransition(async () => {
      const result = await bulkSendInvoices(emailableIds)
      if (result.success) {
        if (result.sent > 0) {
          toast.success(`Sent ${result.sent} invoice${result.sent !== 1 ? 's' : ''} via email`)
        }
        if (result.failed.length > 0) {
          toast.warning(`${result.failed.length} failed: ${result.failed[0]}`)
        }
        setInvoices((prev) => prev.filter((inv) => !emailableIds.includes(inv.id)))
        setSelectedIds(new Set())
      }
    })
  }

  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <Card className="border-yellow-200 dark:border-yellow-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-600" />
            <CardTitle>Unsent Invoices</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {canSend && selectedIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkSent}
                  disabled={isPending}
                >
                  Mark Sent ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendEmails}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  Email ({selectedIds.size})
                </Button>
              </>
            )}
            <Link href="/invoices">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </div>
        <CardDescription>
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} pending &middot; {formatCurrency(total)} total
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 px-3 py-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                if (checked) setSelectedIds(new Set(invoices.map((inv) => inv.id)))
                else setSelectedIds(new Set())
              }}
              aria-label="Select all"
            />
            <span className="text-xs text-gray-500">
              Select all
              {selectedIds.size > 0 && ` (${formatCurrency(selectedTotal)} selected)`}
            </span>
          </div>

          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                selectedIds.has(invoice.id)
                  ? 'bg-yellow-50 dark:bg-yellow-950/30'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <Checkbox
                checked={selectedIds.has(invoice.id)}
                onCheckedChange={(checked) => toggleSelect(invoice.id, !!checked)}
                aria-label={`Select invoice for ${invoice.client?.name}`}
              />
              <Link href={`/invoices/${invoice.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate text-sm">
                    {invoice.client?.name || 'Unknown'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {paymentMethodLabels[invoice.payment_method] || invoice.payment_method}
                  </Badge>
                  {!invoice.client?.contact_email && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      No email
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {invoice.invoice_type === 'batch' && invoice.billing_period
                    ? new Date(invoice.billing_period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : invoice.session?.date
                      ? new Date(invoice.session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''}
                  {invoice.session?.service_type?.name && ` \u00b7 ${invoice.session.service_type.name}`}
                </p>
              </Link>
              <span className="font-medium text-sm shrink-0">{formatCurrency(invoice.amount)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
