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
import { MoreHorizontal, Send, CheckCircle, XCircle, Download, Mail, CreditCard, ExternalLink, Smartphone, Trash2, Link2, Unlink } from 'lucide-react'
import { toast } from 'sonner'
import { downloadFromUrl } from '@/lib/download'
import { LinkSquareInvoiceDialog } from '@/components/invoices/link-square-invoice-dialog'
import type { Invoice } from '@/types/database'

interface InvoiceActionsProps {
  invoice: Invoice & {
    client?: { name: string; contact_email?: string | null } | null
    square_invoice_id?: string | null
    square_payment_url?: string | null
  }
  onStatusChange?: () => void
  canDelete?: boolean
  /** Promote Mark as Paid / Send out of the kebab. Detail page only — table
   *  rows render their own inline actions, so promotion there duplicates them. */
  promoteActions?: boolean
}

export function InvoiceActions({ invoice, onStatusChange, canDelete = false, promoteActions = false }: InvoiceActionsProps) {
  useRouter() // Router available for navigation if needed
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkOpen, setUnlinkOpen] = useState(false)

  async function downloadPdf() {
    setLoading(true)
    try {
      await downloadFromUrl(
        `/api/invoices/${invoice.id}/pdf/`,
        `invoice-${invoice.id.slice(0, 8)}.pdf`
      )

      toast.success('PDF downloaded successfully')
    } catch {
      console.error('[MCA] Error downloading PDF')
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
    const request = fetch(`/api/invoices/${invoice.id}/send/`, {
      method: 'POST',
    }).then(async (response) => {
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send email')
      }
      onStatusChange?.()
    })

    toast.promise(request, {
      loading: 'Sending invoice…',
      success: 'Invoice sent successfully',
      error: (error) => (error instanceof Error ? error.message : 'Failed to send invoice'),
    })

    try {
      await request
    } catch {
      console.error('[MCA] Error sending invoice')
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
    const request = fetch(`/api/invoices/${invoice.id}/square/`, {
      method: 'POST',
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Square invoice')
      }
      onStatusChange?.()
    })

    toast.promise(request, {
      loading: 'Creating Square invoice…',
      success: 'Square invoice created and sent to client!',
      error: (error) => (error instanceof Error ? error.message : 'Failed to create Square invoice'),
    })

    try {
      await request
    } catch {
      console.error('[MCA] Error creating Square invoice')
    } finally {
      setLoading(false)
    }
  }

  function openSquarePaymentLink() {
    if (invoice.square_payment_url) {
      window.open(invoice.square_payment_url, '_blank')
    }
  }

  async function handleUnlinkSquare() {
    const request = fetch(`/api/invoices/${invoice.id}/square/link/`, {
      method: 'DELETE',
    }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink Square invoice')
      }
      setUnlinkOpen(false)
      onStatusChange?.()
    })

    toast.promise(request, {
      loading: 'Unlinking Square invoice…',
      success: 'Square invoice unlinked — status reset to pending',
      error: (error) => (error instanceof Error ? error.message : 'Failed to unlink Square invoice'),
    })

    try {
      await request
    } catch {
      // toast.promise already surfaced the failure
    }
  }

  function handleUpdateStatus(status: 'sent' | 'paid' | 'pending') {
    startTransition(async () => {
      const request = updateInvoiceStatus(invoice.id, status).then((result) => {
        if (!result.success) throw new Error(result.error || 'Failed to update invoice')
        onStatusChange?.()
      })

      toast.promise(request, {
        loading: `Marking as ${status}…`,
        success: `Invoice marked as ${status}`,
        error: (error) => (error instanceof Error ? error.message : 'Failed to update invoice'),
      })

      try {
        await request
      } catch {
        // toast.promise already surfaced the failure
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

  // "Send via Email" (kebab) and the promoted "Send" button share this gate — the
  // only send-flavored action whose availability doesn't also depend on Square state.
  const canSendEmail = Boolean(invoice.client?.contact_email) && invoice.status !== 'paid'

  return (
    <>
    <div className="flex flex-wrap items-center justify-end gap-2">
      {promoteActions && invoice.status !== 'paid' && (
        <Button
          size="sm"
          variant="outline"
          className="text-success border-success/30 hover:bg-success-soft"
          onClick={() => handleUpdateStatus('paid')}
          disabled={loading || isPending}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark as Paid
        </Button>
      )}
      {promoteActions && canSendEmail && (
        <Button
          size="sm"
          variant="outline"
          onClick={sendEmail}
          disabled={loading || isPending}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send
        </Button>
      )}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
          {canSendEmail && (
            <DropdownMenuItem onClick={sendEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Send via Email
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* Square Integration */}
          {!invoice.square_invoice_id && canSendEmail && (
            <DropdownMenuItem onClick={sendViaSquare}>
              <CreditCard className="mr-2 h-4 w-4" />
              Send via Square
            </DropdownMenuItem>
          )}
          {/* Linking needs no client email — the Square invoice already exists. */}
          {!invoice.square_invoice_id && invoice.status !== 'paid' && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setMenuOpen(false)
                setLinkOpen(true)
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Link Square Invoice…
            </DropdownMenuItem>
          )}
          {invoice.square_payment_url && (
            <DropdownMenuItem onClick={openSquarePaymentLink}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Square Invoice
            </DropdownMenuItem>
          )}
          {invoice.square_invoice_id && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setMenuOpen(false)
                setUnlinkOpen(true)
              }}
            >
              <Unlink className="mr-2 h-4 w-4" />
              Unlink Square Invoice
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault()
                  setMenuOpen(false)
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
    </div>

    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this invoice for <strong>{invoice.client?.name || 'this client'}</strong>?
            The session(s) behind it are kept and marked un-billed, so you can re-invoice them later. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlink Square Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            This disconnects the Square invoice and resets this invoice to pending — use it to
            undo a wrong link. Nothing changes in Square, and payment updates from Square will
            no longer sync here until it is linked again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUnlinkSquare}>Unlink</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <LinkSquareInvoiceDialog
      invoiceId={invoice.id}
      open={linkOpen}
      onOpenChange={setLinkOpen}
      onLinked={onStatusChange}
    />
    </>
  )
}
