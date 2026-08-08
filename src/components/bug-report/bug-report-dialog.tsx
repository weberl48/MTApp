'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bug, ChevronDown, ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitBugReport } from '@/app/actions/bug-reports'
import { clientErrorBuffer } from '@/lib/errors/client-buffer'
import { toRoutePattern } from '@/lib/bug-reports/route-pattern'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

interface BugReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Seed the description — error boundaries pass the digest so the crash is
   *  identifiable even if the user writes nothing useful. */
  prefill?: string
}

export function BugReportDialog({ open, onOpenChange, prefill }: BugReportDialogProps) {
  const [submitting, setSubmitting] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        {/* Mounted only while open, so every report starts from a clean form.
            The alternative — an effect that resets state when `open` flips —
            is a cascading render React rightly complains about. */}
        {open && (
          <BugReportForm
            prefill={prefill}
            submitting={submitting}
            onSubmittingChange={setSubmitting}
            onDone={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function BugReportForm({
  prefill,
  submitting,
  onSubmittingChange,
  onDone,
  onCancel,
}: {
  prefill?: string
  submitting: boolean
  onSubmittingChange: (v: boolean) => void
  onDone: () => void
  onCancel: () => void
}) {
  const pathname = usePathname()
  const [description, setDescription] = useState(prefill ?? '')
  const [screenshot, setScreenshot] = useState<{ file: File; url: string } | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mirrors `screenshot` so unmount cleanup can revoke without re-running on
  // every change. An un-revoked object URL pins a 5MB image for the tab's life.
  const screenshotRef = useRef<{ file: File; url: string } | null>(null)
  useEffect(() => {
    return () => {
      if (screenshotRef.current) URL.revokeObjectURL(screenshotRef.current.url)
    }
  }, [])

  const setPicked = (next: { file: File; url: string } | null) => {
    if (screenshotRef.current) URL.revokeObjectURL(screenshotRef.current.url)
    screenshotRef.current = next
    setScreenshot(next)
  }

  const pickFile = (file: File | null) => {
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Screenshot must be a PNG, JPEG or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Screenshot must be smaller than 5MB.')
      return
    }
    setPicked({ file, url: URL.createObjectURL(file) })
  }

  const clearFile = () => {
    setPicked(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      toast.error('Please describe what went wrong in a little more detail.')
      return
    }

    onSubmittingChange(true)
    try {
      const formData = new FormData()
      formData.append('description', description.trim())
      formData.append('url', window.location.href)
      formData.append('userAgent', navigator.userAgent)
      formData.append('viewport', `${window.innerWidth}x${window.innerHeight}`)
      formData.append('recentErrors', JSON.stringify(clientErrorBuffer.snapshot()))
      if (screenshot) formData.append('screenshot', screenshot.file)

      const result = await submitBugReport(formData)

      if (!result.success) {
        toast.error(result.error ?? 'Could not send your report.')
        return
      }

      toast.success(`Thanks — report #${result.reportId} sent.`, {
        description: 'We can see what page you were on, so there’s no need to follow up.',
      })
      onDone()
    } catch {
      toast.error('Could not send your report. Please try again.')
    } finally {
      onSubmittingChange(false)
    }
  }

  const errorCount = clientErrorBuffer.snapshot().length

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-muted-foreground" />
          Report a bug
        </DialogTitle>
        <DialogDescription>
          Tell us what happened. We&apos;ll collect the technical details automatically.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bug-description">What went wrong?</Label>
          <Textarea
            id="bug-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What were you trying to do, and what happened instead?"
            rows={5}
            maxLength={8000}
            autoFocus
            disabled={submitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bug-screenshot">Screenshot (optional)</Label>
          {screenshot ? (
            <div className="relative overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot.url}
                alt="Screenshot to be attached to this bug report"
                className="max-h-48 w-full bg-muted object-contain"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearFile}
                disabled={submitting}
                className="absolute right-2 top-2 h-7 gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="w-full justify-start gap-2 font-normal text-muted-foreground"
            >
              <ImagePlus className="h-4 w-4" />
              Attach a screenshot
            </Button>
          )}
          <input
            ref={fileInputRef}
            id="bug-screenshot"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {/* Said plainly, because a screenshot of most pages in this app shows
              client information and consent has to be informed. */}
          <p className="text-xs text-muted-foreground">
            Screenshots may show client information. Only staff can see it, and it&apos;s deleted
            after 90 days.
          </p>
        </div>

        <div className="rounded-md border bg-muted/40">
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
            aria-expanded={showDetail}
          >
            What gets sent with this report
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDetail ? 'rotate-180' : ''}`}
            />
          </button>
          {showDetail && (
            <dl className="space-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium">Page</dt>
                <dd className="font-mono">{toRoutePattern(pathname)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium">Browser</dt>
                <dd className="truncate">
                  {typeof navigator !== 'undefined' ? navigator.userAgent : '—'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium">Errors</dt>
                <dd>
                  {errorCount === 0 ? 'none recorded this visit' : `${errorCount} recorded this visit`}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-medium">Account</dt>
                <dd>your name and role, so we can follow up</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? 'Sending…' : 'Send report'}
        </Button>
      </DialogFooter>
    </>
  )
}
