-- One Square invoice may only ever be linked to ONE local invoice.
--
-- The Square webhook updates invoices by square_invoice_id; two rows sharing an
-- ID would both flip to paid on a single payment event. The app's own create
-- path cannot duplicate (deterministic idempotency keys reuse the same Square
-- invoice per local invoice), but the manual "Link Square invoice" action
-- (2026-08-08) could without this index. The link API treats 23505 as a 409.
--
-- Apply by hand: cert first, verify, then prod (repo convention).

CREATE UNIQUE INDEX IF NOT EXISTS invoices_square_invoice_id_unique
  ON invoices (square_invoice_id)
  WHERE square_invoice_id IS NOT NULL;
