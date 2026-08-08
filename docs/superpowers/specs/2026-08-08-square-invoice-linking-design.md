# Link Square Invoice — Design

**Date:** 2026-08-08
**Status:** Approved (conversation, 2026-08-08)

## Problem

The Square webhook can only update local invoices it can match by
`invoices.square_invoice_id`, which is populated solely by the app's own
"Send via Square" path. When the owner creates an invoice directly in the
Square Dashboard, Square's `invoice.updated` / `invoice.payment_made` events
arrive but match nothing, so the app never learns the invoice was sent or
paid.

## Solution

A manual "Link Square invoice" action on a local invoice. Once linked, the
existing webhook does everything (sent/paid transitions, `paid_date`, owner
payment notification) with zero webhook changes.

Ruled out: automatic reconciliation (needs a client↔Square-customer mapping
that guesses wrong exactly when two invoices share a client and amount), and
creating local invoices *from* Square invoices (out of scope).

## API

All routes follow the existing `/api/invoices/[id]/square/` pattern: auth →
`can(role, 'invoice:send')` → org-ownership check (developers exempt).

1. **`GET /api/square/invoices/candidates/?invoiceId=<uuid>`**
   Loads the local invoice (guards: exists, not `paid`, not already linked),
   the client's `square_customer_id`, and up to ~200 recent Square invoices
   for the default location via `squareClient.invoices.list()`. Filters out
   Square IDs already present on this org's invoices and Square statuses
   `CANCELED`/`FAILED`. Returns candidates sorted suggested-first:
   `{ id, invoiceNumber, title, customerName, customerEmail, amount, status,
   createdAt, publicUrl, suggested }`.
   Suggested = exact amount match OR Square customer matches the client's
   saved `square_customer_id`.

2. **`POST /api/invoices/[id]/square/link/`** — body `{ squareInvoiceId }`.
   Guards: local invoice not `paid`, not already linked, Square ID not linked
   to another local invoice (code check + DB unique index for races → 409).
   Fetches the Square invoice (`invoices.get`) to confirm existence, then
   writes `square_invoice_id` + `square_payment_url` and adopts the current
   Square status through the existing `resolveSquareWebhookStatus()`
   (DRAFT→pending, UNPAID/SCHEDULED→sent, PAID→paid + `paid_date`). Also
   backfills `clients.square_customer_id` when the client lacks one.
   No owner "payment received" email on link-to-paid — the owner is the one
   clicking.

3. **`DELETE /api/invoices/[id]/square/link/`** — unlink (mistake recovery,
   per user decision). Clears both Square columns and resets status to
   `pending` via `invoiceStatusUpdate('pending', …)` (clears `paid_date`).
   Deliberate human correction, so the webhook's forward-only rule does not
   apply. Status can then be adjusted via the existing status actions.

## UI

Both actions live in the existing `InvoiceActions` dropdown (detail page and
list rows), in the Square section:

- **"Link Square invoice…"** — shown when `!square_invoice_id` and status is
  not `paid`. Opens a dialog (`src/components/invoices/
  link-square-invoice-dialog.tsx`) that fetches candidates, shows suggested
  matches first with a badge, supports client-side text search
  (number/customer/title), and links on confirm. Toast + `onStatusChange()`.
- **"Unlink Square invoice"** — shown when `square_invoice_id` is set; confirm
  dialog, then DELETE. Toast + `onStatusChange()`.

Batch invoices behave identically (the link is just an ID).

## Data integrity

Migration `20260808_square_invoice_id_unique.sql`: partial unique index on
`invoices(square_invoice_id) WHERE square_invoice_id IS NOT NULL`. The
webhook updates by that column, so two rows sharing one Square ID would both
flip paid. **Hand-applied: cert first, verify, then prod** (repo convention).

## Logic placement & tests

Pure logic in `src/lib/square/link.ts` with colocated Vitest tests:
`squareInvoiceToCandidate()` (SDK object → DTO, bigint cents → dollars,
missing-field tolerance) and `sortCandidates()` / suggestion scoring
(amount match, customer match, newest-first within groups). Route handlers
stay thin.

## Docs

- Help: "Linking an invoice created in Square" section in the invoices
  article + keywords/synonyms so "link square" finds it.
- CLAUDE.md: API-route table rows + Key Library Modules entry.
