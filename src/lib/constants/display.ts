/** Centralized display constants for status colors, labels, and formatting */

// --- Session status ---

export const sessionStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  no_show: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const sessionStatusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  no_show: 'No Show',
  cancelled: 'Cancelled',
}

// --- Invoice status ---

export const invoiceStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// --- Payment methods ---

export const paymentMethodLabels: Record<string, string> = {
  private_pay: 'Private Pay',
  self_directed: 'Self-Directed',
  group_home: 'Group Home',
  scholarship: 'Scholarship',
  venmo: 'Venmo',
}

export const billingMethodLabels: Record<string, string> = {
  square: 'Square',
  check: 'Check',
  email: 'Email',
  other: 'Other',
}

// --- Org-aware list helpers ---

import type { OrganizationSettings } from '@/types/database'

/**
 * Get visible payment methods with org-customized labels.
 * Falls back to default labels if no org overrides exist.
 */
export function getPaymentMethodOptions(
  settings?: OrganizationSettings | null
): { value: string; label: string }[] {
  const overrides = settings?.custom_lists?.payment_methods
  return Object.entries(paymentMethodLabels)
    .filter(([key]) => {
      const config = overrides?.[key]
      return config ? config.visible : true
    })
    .map(([key, defaultLabel]) => ({
      value: key,
      label: overrides?.[key]?.label || defaultLabel,
    }))
}

/**
 * Get visible billing methods with org-customized labels.
 */
export function getBillingMethodOptions(
  settings?: OrganizationSettings | null
): { value: string; label: string }[] {
  const overrides = settings?.custom_lists?.billing_methods
  return Object.entries(billingMethodLabels)
    .filter(([key]) => {
      const config = overrides?.[key]
      return config ? config.visible : true
    })
    .map(([key, defaultLabel]) => ({
      value: key,
      label: overrides?.[key]?.label || defaultLabel,
    }))
}

/**
 * Get the display label for a payment method, respecting org overrides.
 */
export function getPaymentMethodLabel(
  method: string,
  settings?: OrganizationSettings | null
): string {
  return settings?.custom_lists?.payment_methods?.[method]?.label
    || paymentMethodLabels[method]
    || method
}

/**
 * Get the display label for a billing method, respecting org overrides.
 */
export function getBillingMethodLabel(
  method: string,
  settings?: OrganizationSettings | null
): string {
  return settings?.custom_lists?.billing_methods?.[method]?.label
    || billingMethodLabels[method]
    || method
}

// --- Invoice number formatting ---

export function formatInvoiceNumber(invoiceId: string): string {
  return `INV-${invoiceId.slice(0, 8).toUpperCase()}`
}
