import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
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
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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

      {/* Table */}
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
    </div>
  )
}
