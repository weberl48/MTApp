'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, ExternalLink, Download, Info } from 'lucide-react'

interface InvoiceClientPreviewProps {
  invoiceId: string
  clientName?: string | null
  squareInvoiceId?: string | null
  squarePaymentUrl?: string | null
}

/**
 * "What the client sees" — renders the actual invoice PDF inline.
 *
 * The iframe points at /api/invoices/[id]/pdf/?inline=1, which is built from
 * the same data source as the emailed attachment (fetchInvoicePdfData), so the
 * preview can't drift from what's sent. The PDF is only generated when the
 * preview is expanded. Small screens skip the iframe (mobile PDF embeds are
 * unreliable) and open the PDF in a new tab instead.
 */
export function InvoiceClientPreview({
  invoiceId,
  clientName,
  squareInvoiceId,
  squarePaymentUrl,
}: InvoiceClientPreviewProps) {
  const [open, setOpen] = useState(false)

  const inlineUrl = `/api/invoices/${invoiceId}/pdf/?inline=1`
  const downloadUrl = `/api/invoices/${invoiceId}/pdf/`

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Client Preview</CardTitle>
            <CardDescription>
              See exactly what {clientName || 'the client'} receives
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show preview
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {squareInvoiceId && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-800 dark:text-blue-300">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                This invoice is billed through Square — the client receives Square&apos;s hosted
                invoice, not this PDF.{' '}
                {squarePaymentUrl && (
                  <a
                    href={squarePaymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    View it on Square
                  </a>
                )}
              </p>
            </div>
          )}

          {/* Desktop: embedded PDF. Mobile embeds are unreliable — new tab instead. */}
          <div className="hidden md:block border rounded-lg overflow-hidden bg-muted">
            <iframe
              src={inlineUrl}
              title="Invoice preview"
              className="w-full"
              style={{ height: '75vh', minHeight: 500 }}
            />
          </div>
          <div className="md:hidden">
            <a href={inlineUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Open preview
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={inlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open full size
              </Button>
            </a>
            <a href={downloadUrl}>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </a>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
