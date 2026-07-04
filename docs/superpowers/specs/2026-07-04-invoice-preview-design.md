# Invoice Preview & Post-Generate View — Design

**Date:** 2026-07-04
**Status:** Approved (user confirmed both recommended options + scope)

## Problem

The only way for the owner to see what a client will receive is "Download PDF" —
too much friction. After generating scholarship invoices there is no path to the
result beyond a count toast. Additionally, the batch ("Monthly Statement") PDF
header has a layout bug: the long title overlaps the org logo and runs off the
page edge.

## Decisions (user-confirmed)

1. **Preview = the exact PDF, rendered inline** (not an HTML replica). Zero
   drift between preview and what is sent.
2. **Post-generate:** success toast gains a **View** action. Exactly one
   invoice generated → open `/invoices/{id}/`; several → jump to the All
   Invoices tab.

## Design

### 1. Shared PDF data builder — `src/lib/invoices/pdf-data.ts`

`fetchInvoicePdfData(supabase, invoiceId)` returns
`{ invoice, footerText, paymentInstructions } | null` — invoice with client,
session (incl. decrypted `client_notes`), batch `items`, org invoice settings.

- Fixes an existing bug: both the PDF route and `sendInvoiceById` select the
  session's internal `notes` (never rendered — correctly, it's staff PHI) but
  NOT `client_notes`, which is the field the template's "Session Notes" section
  displays via `clientInvoiceNotes()`. Net effect today: client-facing notes
  never appear on single-session invoices, and the route decrypts internal PHI
  it never uses.
- Fix: select `client_notes`, decrypt it (tolerating legacy plaintext), never
  select internal `notes` at all.
- Both `/api/invoices/[id]/pdf` and `src/lib/invoices/send.ts` consume this
  builder → **preview is structurally guaranteed to match the emailed PDF**.
- Authorization stays in the route (send.ts callers do their own checks).

### 2. PDF route inline mode

`GET /api/invoices/[id]/pdf/?inline=1` → `Content-Disposition: inline`
(default remains `attachment` for the existing Download button).

### 3. Preview card on `/invoices/[id]/`

Collapsible card "Preview — what the client sees":

- Expanding lazily mounts `<iframe src=".../pdf/?inline=1">` (PDF is only
  generated when opened; no cost on every page view).
- Small screens: embedded PDF viewers are unreliable → show "Open preview"
  button (new tab) instead of the iframe.
- Buttons: Open full size (new tab), Download PDF.
- If the invoice has a `square_invoice_id`: note that Square-billed clients
  receive Square's hosted invoice, with the existing "View on Square" link.

### 4. Post-generate View actions

- `generateAllUnbilledScholarshipInvoices` collects and returns `invoiceIds`
  (today they're discarded).
- `scholarshipBatchToasts()` (tested lib) decides the toast set AND the view
  target: `{ kind: 'invoice', id }` when exactly one generated,
  `{ kind: 'list' }` when several, none on zero/error.
- Invoices page wires sonner `action: { label: 'View', onClick }` on the
  success toast for both Generate All and the per-client/month Generate button
  (single generate always links directly to the new invoice).

### 5. Batch PDF header fix

In `invoice-pdf.tsx`, the header row has two unconstrained auto-width columns;
the 28pt batch title "Monthly Statement - February 2026" overlaps the logo and
clips at the page edge. Fix:

- Batch title stacks: "Monthly Statement" (fits 28pt is too wide → ~20pt),
  period ("February 2026") as a second line, invoice number below.
- Structural guard: left column `flexShrink: 0`-ish natural width, right column
  gets `flex: 1` + right-aligned text so any future long content wraps instead
  of overlapping.

## Out of scope

- Changing the Square-hosted invoice experience.
- Per-session auto-generated invoice flow changes.
- HTML replica of the invoice.

## Testing

- Colocated unit tests: `pdf-data.test.ts` (notes decryption, items shaping),
  `scholarship-batch-feedback.test.ts` (view-target logic, existing toast cases).
- Manual/browser: preview card renders inline PDF; batch PDF header clean at
  long month names; toast View navigates correctly.
- Help articles updated (invoices category).
