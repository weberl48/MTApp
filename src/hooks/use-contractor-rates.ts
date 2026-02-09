import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ContractorPricingOverrides } from '@/lib/pricing'

export function useContractorRates(contractorId: string) {
  const supabase = createClient()
  const [payIncrease, setPayIncrease] = useState(0)
  const [customRates, setCustomRates] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [{ data: contractor }, { data: rates }] = await Promise.all([
        supabase.from('users').select('pay_increase').eq('id', contractorId).single(),
        supabase.from('contractor_rates').select('service_type_id, contractor_pay').eq('contractor_id', contractorId),
      ])

      if (cancelled) return

      if (contractor?.pay_increase) {
        setPayIncrease(contractor.pay_increase)
      }

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
    if (!customPay && !payIncrease) return undefined
    return { customContractorPay: customPay, payIncrease }
  }

  const hasMissingRate = useMemo(() => {
    return (serviceTypeId: string) => {
      if (customRates.size > 0) return !customRates.has(serviceTypeId)
      return customRates.size === 0
    }
  }, [customRates])

  return { payIncrease, customRates, getOverrides, hasMissingRate, loading }
}
