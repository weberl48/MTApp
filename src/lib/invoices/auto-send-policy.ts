import type { OrganizationSettings } from '@/types/database'

/**
 * Resolve which channel (if any) an approved session's invoices should auto-send through.
 *
 * Returns null when auto-send-on-approve is disabled, or the method is 'none'/unset.
 * BOTH the single-approve and bulk-approve paths must gate on this. A prior bug had bulk
 * approve call the Square auto-send directly, ignoring `auto_send_invoice_on_approve`, so
 * bulk-approving sessions sent real Square invoices to clients even when the org had
 * auto-send turned off.
 */
export function resolveAutoSendMethod(
  settings: OrganizationSettings | null | undefined
): 'square' | 'email' | null {
  if (!settings?.automation?.auto_send_invoice_on_approve) return null
  const method = settings.automation.auto_send_invoice_method
  return method === 'square' || method === 'email' ? method : null
}
