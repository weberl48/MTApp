import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContractorPricingOverrides } from '@/lib/pricing'

interface RateData {
  contractorPay: number
  durationIncrement: number | null
}

export function useContractorRates(contractorId: string) {
  const supabase = createClient()
  const [customRates, setCustomRates] = useState<Map<string, RateData>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: rates } = await supabase
        .from('contractor_rates')
        .select('service_type_id, contractor_pay, duration_increment')
        .eq('contractor_id', contractorId)

      if (cancelled) return

      if (rates && rates.length > 0) {
        const map = new Map<string, RateData>()
        for (const rate of rates) {
          map.set(rate.service_type_id, {
            contractorPay: rate.contractor_pay,
            durationIncrement: rate.duration_increment,
          })
        }
        setCustomRates(map)
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [contractorId, supabase])

  function getOverrides(serviceTypeId: string): ContractorPricingOverrides | undefined {
    const rateData = customRates.get(serviceTypeId)
    if (!rateData) return undefined
    return {
      customContractorPay: rateData.contractorPay,
      durationIncrement: rateData.durationIncrement,
    }
  }

  const hasMissingRate = useMemo(() => {
    return (serviceTypeId: string) => {
      if (customRates.size > 0) return !customRates.has(serviceTypeId)
      return customRates.size === 0
    }
  }, [customRates])

  return { customRates, getOverrides, hasMissingRate, loading }
}
