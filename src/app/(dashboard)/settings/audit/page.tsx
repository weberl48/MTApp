'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AuditLogTable } from '@/components/tables/audit-log-table'
import { useOrganization } from '@/contexts/organization-context'
import Link from 'next/link'

export default function AuditLogPage() {
  const { organization, can } = useOrganization()
  const isOwner = can('settings:edit')

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="text-center py-12 text-gray-500">
        You do not have permission to view the audit log.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/">
          <Button variant="ghost" size="icon" aria-label="Back to settings">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="text-gray-500 dark:text-gray-400">Track all changes for compliance</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>
            Track all changes to sessions, invoices, clients, and other data for compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable />
        </CardContent>
      </Card>
    </div>
  )
}
