'use client'

import { useImpersonation } from '@/contexts/impersonation-context'
import { Button } from '@/components/ui/button'
import { Eye, X, ExternalLink } from 'lucide-react'

export function ImpersonationBanner() {
  const {
    impersonatedContractor,
    isImpersonatingContractor,
    impersonatedClient,
    isImpersonatingClient,
    clearImpersonation,
    isImpersonating,
  } = useImpersonation()

  if (!isImpersonating) {
    return null
  }

  const name = impersonatedContractor?.name || impersonatedClient?.name
  const type = isImpersonatingContractor ? 'Contractor' : 'Client'
  const portalToken = impersonatedClient?.portalToken

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="text-sm font-medium">
          Viewing as: <strong>{name}</strong> ({type})
        </span>
        {isImpersonatingClient && portalToken && (
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:text-white hover:bg-amber-600 h-7 px-2"
            onClick={() => {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
              window.open(`${appUrl}/portal/${portalToken}`, '_blank')
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open Portal
          </Button>
        )}
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
