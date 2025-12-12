'use client'

import { useImpersonation } from '@/contexts/impersonation-context'
import { Button } from '@/components/ui/button'
import { Eye, X } from 'lucide-react'

export function ImpersonationBanner() {
  const { impersonatedContractor, isImpersonatingContractor, clearImpersonation } = useImpersonation()

  if (!isImpersonatingContractor) {
    return null
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="text-sm font-medium">
          Viewing as: <strong>{impersonatedContractor?.name}</strong> (Contractor)
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:text-white hover:bg-amber-600 h-7 px-2"
        onClick={clearImpersonation}
      >
        <X className="h-4 w-4 mr-1" />
        Exit
      </Button>
    </div>
  )
}
