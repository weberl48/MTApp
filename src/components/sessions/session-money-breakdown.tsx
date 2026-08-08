import { formatCurrency } from '@/lib/pricing'
import type { SessionDisplayBreakdown } from '@/lib/sessions/total'

interface SessionMoneyBreakdownProps {
  breakdown: SessionDisplayBreakdown | null
  className?: string
}

/**
 * The "MCA $17.00 · Pay $133.00" line that sits under a session's total.
 *
 * Shared by the sessions list and the dashboard Pending Approvals card so the two cannot
 * drift — the split is the kind of number that has to mean the same thing on every surface
 * that shows it.
 *
 * Callers are responsible for the permission gate (`financial:view-details`); this component
 * deliberately does not check it, so there is exactly one place per surface where the gate
 * lives and no chance of a second, subtly different check.
 *
 * A negative MCA cut is rendered in the warning colour rather than hidden or clamped: it means
 * the contractor is paid more than the session bills, which is real and worth flagging. See
 * `sessionDisplayBreakdown` for why it happens.
 */
export function SessionMoneyBreakdown({ breakdown, className = '' }: SessionMoneyBreakdownProps) {
  if (!breakdown) return null

  const { mcaCut, contractorPay } = breakdown
  const segments: React.ReactNode[] = []

  if (mcaCut !== null) {
    segments.push(
      <span key="cut" className={mcaCut < 0 ? 'text-warning font-medium' : undefined}>
        MCA {formatCurrency(mcaCut)}
      </span>
    )
  }

  if (contractorPay !== null) {
    segments.push(<span key="pay">Pay {formatCurrency(contractorPay)}</span>)
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      {segments.map((segment, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {segment}
        </span>
      ))}
    </p>
  )
}
