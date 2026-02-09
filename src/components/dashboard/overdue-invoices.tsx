'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { updateInvoiceStatus } from '@/app/actions/invoices'
import { formatCurrency } from '@/lib/pricing'
import { toast } from 'sonner'
import Link from 'next/link'

interface OverdueInvoice {
  id: string
  amount: number
  due_date: string
  client: { name: string } | null
}

export function OverdueInvoices() {
  const [invoices, setInvoices] = useState<OverdueInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      const { data } = await supabase
        .from('invoices')
        .select('id, amount, due_date, client:clients(name)')
        .eq('status', 'sent')
        .lt('due_date', todayStr)
        .order('due_date', { ascending: true })
        .limit(10)

      setInvoices((data as unknown as OverdueInvoice[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading || invoices.length === 0) return null

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)

  async function handleMarkPaid(invoiceId: string) {
    setMarkingPaidId(invoiceId)
    const result = await updateInvoiceStatus(invoiceId, 'paid')
    if (result.success) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId))
      toast.success('Invoice marked as paid')
    } else {
      toast.error('error' in result ? result.error : 'Failed to update')
    }
    setMarkingPaidId(null)
  }

  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-700 dark:text-red-400">Overdue Invoices</CardTitle>
          </div>
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950">
              View All
            </Button>
          </Link>
        </div>
        <CardDescription className="text-red-600 dark:text-red-400">
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} past due &middot; {formatCurrency(totalAmount)} outstanding
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {invoices.map((invoice) => {
            const clientData = invoice.client as { name: string } | { name: string }[] | null
            const clientName = Array.isArray(clientData) ? clientData[0]?.name : clientData?.name
            const daysOverdue = Math.floor(
              (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
            )

            return (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
              >
                <Link href={`/invoices/${invoice.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{clientName || 'Unknown Client'}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                  </p>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-red-700 dark:text-red-400 text-sm">
                    {formatCurrency(invoice.amount)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={markingPaidId === invoice.id}
                    onClick={() => handleMarkPaid(invoice.id)}
                  >
                    {markingPaidId === invoice.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark Paid
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
