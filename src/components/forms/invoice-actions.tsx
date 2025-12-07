'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Send, CheckCircle, XCircle, Download, Mail, CreditCard, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Invoice } from '@/types/database'

interface InvoiceActionsProps {
  invoice: Invoice & {
    client?: { name: string; contact_email?: string | null } | null
    square_invoice_id?: string | null
    square_payment_url?: string | null
  }
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function downloadPdf() {
    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    } finally {
      setLoading(false)
    }
  }

  async function sendEmail() {
    if (!invoice.client?.contact_email) {
      toast.error('Client does not have an email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send email')
      }

      toast.success('Invoice sent successfully')
      router.refresh()
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send invoice')
    } finally {
      setLoading(false)
    }
  }

  async function sendViaSquare() {
    if (!invoice.client?.contact_email) {
      toast.error('Client does not have an email address. Square requires an email.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/square`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Square invoice')
      }

      toast.success('Square invoice created and sent to client!')
      router.refresh()
    } catch (error) {
      console.error('Error creating Square invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create Square invoice')
    } finally {
      setLoading(false)
    }
  }

  function openSquarePaymentLink() {
    if (invoice.square_payment_url) {
      window.open(invoice.square_payment_url, '_blank')
    }
  }

  async function updateStatus(status: 'sent' | 'paid' | 'pending') {
    setLoading(true)

    try {
      const updates: Partial<Invoice> = { status }

      if (status === 'paid') {
        updates.paid_date = new Date().toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoice.id)

      if (error) throw error

      toast.success(`Invoice marked as ${status}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Failed to update invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {invoice.status === 'pending' && (
          <DropdownMenuItem onClick={() => updateStatus('sent')}>
            <Send className="mr-2 h-4 w-4" />
            Mark as Sent
          </DropdownMenuItem>
        )}
        {invoice.status !== 'paid' && (
          <DropdownMenuItem onClick={() => updateStatus('paid')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        {invoice.status === 'paid' && (
          <DropdownMenuItem onClick={() => updateStatus('sent')}>
            <XCircle className="mr-2 h-4 w-4" />
            Mark as Unpaid
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={downloadPdf}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
        {invoice.client?.contact_email && invoice.status !== 'paid' && (
          <DropdownMenuItem onClick={sendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send via Email
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {/* Square Integration */}
        {!invoice.square_invoice_id && invoice.client?.contact_email && invoice.status !== 'paid' && (
          <DropdownMenuItem onClick={sendViaSquare}>
            <CreditCard className="mr-2 h-4 w-4" />
            Send via Square
          </DropdownMenuItem>
        )}
        {invoice.square_payment_url && (
          <DropdownMenuItem onClick={openSquarePaymentLink}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Square Invoice
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
