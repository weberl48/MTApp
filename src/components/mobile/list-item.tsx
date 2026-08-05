'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface MobileListItemProps {
  title: ReactNode
  trailing?: ReactNode
  meta?: ReactNode
  footer?: ReactNode
  href?: string
  checkbox?: { checked: boolean; onChange: (checked: boolean) => void; label: string }
  className?: string
}

function TitleRow({
  title,
  trailing,
  checkbox,
}: Pick<MobileListItemProps, 'title' | 'trailing' | 'checkbox'>) {
  return (
    <div className="flex items-center">
      {checkbox && (
        // stopPropagation mirrors the desktop table's TableCell guard
        // (same-tree React handlers); preventDefault is the one that
        // actually matters here — stopPropagation alone never cancels an
        // ancestor <Link>'s navigation (MDN: it "does not prevent any
        // default actions from occurring; clicks on links are still
        // processed"). Both are required so a checkbox tap toggles
        // selection instead of opening the card.
        <span
          className="mr-2 flex shrink-0 items-center"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <Checkbox
            checked={checkbox.checked}
            onCheckedChange={(checked) => checkbox.onChange(checked === true)}
            aria-label={checkbox.label}
          />
        </span>
      )}
      <span className="font-medium text-foreground truncate">{title}</span>
      {trailing !== undefined && (
        <span className="ml-auto font-semibold tabular-nums">{trailing}</span>
      )}
    </div>
  )
}

/**
 * Shared card primitive for mobile list pages (invoices, team, payroll, ...).
 * Exactly one of {desktop <Table>, a stack of these} is ever in the DOM per
 * useIsMobile() branch — docs/superpowers/plans/2026-08-05-mobile-experience.md
 * Task 2.1. Later batches consume this exact prop shape.
 *
 * Tap target: with no footer, the whole card is the Link (the only other
 * interactive element is the optional checkbox, which stops propagation so
 * it never triggers navigation). With a footer (action buttons, kebabs),
 * only the title row is the Link — footer controls are real siblings, never
 * nested inside the anchor, so buttons/menus inside it behave normally.
 */
export function MobileListItem({
  title,
  trailing,
  meta,
  footer,
  href,
  checkbox,
  className,
}: MobileListItemProps) {
  const titleRow = <TitleRow title={title} trailing={trailing} checkbox={checkbox} />
  const metaRow = meta !== undefined && (
    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 items-center">
      {meta}
    </div>
  )
  const footerRow = footer !== undefined && (
    <div className="flex items-center gap-2 pt-1">{footer}</div>
  )

  const cardClass = cn('bg-card border border-border rounded-lg p-3 space-y-1.5', className)

  if (href && footer === undefined) {
    return (
      <Link href={href} className={cn(cardClass, 'block')}>
        {titleRow}
        {metaRow}
      </Link>
    )
  }

  return (
    <div className={cardClass}>
      {href ? (
        <Link href={href} className="block">
          {titleRow}
        </Link>
      ) : (
        titleRow
      )}
      {metaRow}
      {footerRow}
    </div>
  )
}
