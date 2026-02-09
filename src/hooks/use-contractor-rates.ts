import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContractorPricingOverrides } from '@/lib/pricing'

export function useContractorRates(contractorId: string) {
  const supabase = createClient()
  // NOTE: pay_increase feature disabled — kept for reference in case we re-enable
  // const [payIncrease, setPayIncrease] = useState(0)
  const [customRates, setCustomRates] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // NOTE: pay_increase fetch removed — was: supabase.from('users').select('pay_increase')...
      const { data: rates } = await supabase
        .from('contractor_rates')
        .select('service_type_id, contractor_pay')
        .eq('contractor_id', contractorId)

      if (cancelled) return

      if (rates && rates.length > 0) {
        const map = new Map<string, number>()
        for (const rate of rates) {
          map.set(rate.service_type_id, rate.contractor_pay)
        }
        setCustomRates(map)
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [contractorId, supabase])

  function getOverrides(serviceTypeId: string): ContractorPricingOverrides | undefined {
    const customPay = customRates.get(serviceTypeId)
    if (!customPay) return undefined
    return { customContractorPay: customPay }
  }

  const hasMissingRate = useMemo(() => {
    return (serviceTypeId: string) => {
      if (customRates.size > 0) return !customRates.has(serviceTypeId)
      return customRates.size === 0
    }
  }, [customRates])

  return { customRates, getOverrides, hasMissingRate, loading }
}
