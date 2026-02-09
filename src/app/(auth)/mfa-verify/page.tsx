'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MfaChallenge } from '@/components/forms/mfa-challenge'
import { needsMfaVerification } from '@/lib/supabase/mfa'
import { Loader2 } from 'lucide-react'

export default function MfaVerifyPage() {
  const router = useRouter()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login/')
        return
      }

      const { needsVerification, factorId: fid } = await needsMfaVerification()

      if (!needsVerification || !fid) {
        // Already verified or no MFA — go to dashboard
        router.push('/dashboard/')
        router.refresh()
        return
      }

      setFactorId(fid)
      setLoading(false)
    }

    check()
  }, [router])

  async function handleCancel() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!factorId) return null

  return <MfaChallenge factorId={factorId} onCancel={handleCancel} />
}
