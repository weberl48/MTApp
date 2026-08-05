/** Centralized display constants for status colors, labels, and formatting */

// --- Session status ---

export const sessionStatusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-info-soft text-info-soft-foreground',
  approved: 'bg-success-soft text-success-soft-foreground',
  no_show: 'bg-warning-soft text-warning-soft-foreground',
  cancelled: 'bg-destructive-soft text-destructive-soft-foreground',
}

export const sessionStatusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  no_show: 'No Show',
  cancelled: 'Cancelled',
}

// Card left-edge accents (sessions list). Same hue family as the badge
// colors above, but solid tokens — a 3px edge needs more saturation than
// a soft badge background to read at a glance.
export const sessionStatusAccents: Record<string, string> = {
  draft: 'border-l-muted-foreground/40',
  submitted: 'border-l-info',
  approved: 'border-l-success',
  no_show: 'border-l-warning',
  cancelled: 'border-l-destructive',
}

// --- Invoice status ---

export const invoiceStatusColors: Record<string, string> = {
  pending: 'bg-warning-soft text-warning-soft-foreground',
  sent: 'bg-info-soft text-info-soft-foreground',
  paid: 'bg-success-soft text-success-soft-foreground',
  overdue: 'bg-destructive-soft text-destructive-soft-foreground',
}

export const invoiceStatusLabels: Record<string, string> = {
  pending: 'Pending',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
}

// --- User roles ---

export const roleLabels: Record<string, string> = {
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Administrator',
  contractor: 'Contractor',
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
