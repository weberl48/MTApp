/**
 * The notes to display on the CLIENT-FACING invoice PDF.
 *
 * Internal session notes (`session.notes`, labelled "Internal notes (not visible to
 * client)" in the session form) are staff-only PHI and must NEVER appear on the client's
 * invoice. Only the client-facing `client_notes` are eligible. The invoice PDF previously
 * rendered `session.notes` directly, leaking internal clinical notes onto the document
 * emailed to clients (and, for group-home invoices, to a third-party billing contact).
 */
export function clientInvoiceNotes(
  session: { notes?: string | null; client_notes?: string | null } | null | undefined
): string | null {
  const text = session?.client_notes?.trim()
  return text ? text : null
}
