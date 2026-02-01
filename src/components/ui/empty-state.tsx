import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface EmptyStateAction {
  label: string
  href: string
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="mb-4">{description}</p>}
      {action && (
        <Link href={action.href}>
          <Button>{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
