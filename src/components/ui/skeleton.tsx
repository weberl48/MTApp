import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-skeleton',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-16 mt-2" />
    </div>
  )
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center justify-between p-4 bg-skeleton rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Recent Sessions */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="p-6 space-y-4">
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </div>
    </div>
  )
}

/**
 * One mobile-card-shaped placeholder, three lines: title+trailing row, meta
 * line, footer (badge/action-width) line — mirrors `MobileListItem`'s row
 * shape one-for-one.
 */
function SkeletonCardListItem() {
  return (
    <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
      <div className="flex items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="ml-auto h-4 w-16" />
      </div>
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  )
}

/**
 * Card-list loading placeholder — the mobile counterpart to the row-based
 * skeletons above, matching `MobileListItem`'s card shape (bg-card/border/
 * rounded-lg/p-3/space-y-1.5) so the skeleton-to-content swap doesn't shift
 * layout on mobile list pages (invoices, team, payroll, ...).
 */
export function SkeletonCardList() {
  return (
    <div className="space-y-2">
      <SkeletonCardListItem />
      <SkeletonCardListItem />
      <SkeletonCardListItem />
      <SkeletonCardListItem />
    </div>
  )
}

export function SessionsListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-card">
        <div className="p-6 border-b">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
        <div className="p-6 space-y-4">
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </div>
    </div>
  )
}

export function InvoicesListSkeleton() {
  // Server/first-render snapshot is false (desktop-shaped), same as every
  // other useIsMobile() consumer — the mobile branch below only takes over
  // post-hydration, so there's no flash (see use-is-mobile.ts).
  const isMobile = useIsMobile()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* List — card stack on mobile (matches MobileListItem), table on desktop */}
      {isMobile ? (
        <SkeletonCardList />
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>
          <div className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
