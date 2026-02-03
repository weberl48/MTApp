'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceStatus, deleteInvoice } from '@/app/actions/invoices'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Send, CheckCircle, XCircle, Download, Mail, CreditCard, ExternalLink, Smartphone, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Invoice } from '@/types/database'

interface InvoiceActionsProps {
  invoice: Invoice & {
    client?: { name: string; contact_email?: string | null } | null
    square_invoice_id?: string | null
    square_payment_url?: string | null
  }
  onStatusChange?: () => void
  canDelete?: boolean
}

export function InvoiceActions({ invoice, onStatusChange, canDelete = false }: InvoiceActionsProps) {
  useRouter() // Router available for navigation if needed
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)

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
      onStatusChange?.()
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
      onStatusChange?.()
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

  function handleUpdateStatus(status: 'sent' | 'paid' | 'pending') {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoice.id, status)
      if (result.success) {
        toast.success(`Invoice marked as ${status}`)
        onStatusChange?.()
      } else {
        toast.error(result.error || 'Failed to update invoice')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteInvoice(invoice.id)
      if (result.success) {
        toast.success('Invoice deleted')
        setDeleteOpen(false)
        onStatusChange?.()
      } else {
        toast.error(result.error || 'Failed to delete invoice')
      }
    })
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading || isPending} aria-label="Invoice actions menu">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {invoice.status === 'pending' && (
          <DropdownMenuItem onClick={() => handleUpdateStatus('sent')}>
            <Send className="mr-2 h-4 w-4" />
            Mark as Sent
          </DropdownMenuItem>
        )}
        {invoice.status !== 'paid' && (
          <>
            <DropdownMenuItem onClick={() => handleUpdateStatus('paid')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus('paid')}>
              <Smartphone className="mr-2 h-4 w-4" />
              Mark Paid (Venmo)
            </DropdownMenuItem>
          </>
        )}
        {invoice.status === 'paid' && (
          <DropdownMenuItem onClick={() => handleUpdateStatus('sent')}>
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
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={(e) => {
                e.preventDefault()
                setDeleteOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Invoice
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this invoice for <strong>{invoice.client?.name || 'this client'}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
