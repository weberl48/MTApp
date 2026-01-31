'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

interface SquareStatus {
  configured: boolean
  sandbox: boolean
  environment: 'sandbox' | 'production'
}

export function SquareStatusBadge() {
  const [status, setStatus] = useState<SquareStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/square/status')
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
        }
      } catch {
        // Silently fail - badge just won't show
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  if (loading || !status) return null

  if (!status.configured) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Square Not Configured
      </Badge>
    )
  }

  if (status.sandbox) {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
        <AlertTriangle className="h-3 w-3" />
        Square: Sandbox Mode
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20">
      <CheckCircle2 className="h-3 w-3" />
      Square: Production
    </Badge>
  )
}
