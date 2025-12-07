'use client'

import { useState, useEffect } from 'react'
import { isNativePlatform, getPlatform, isIOS, isAndroid } from '@/lib/capacitor/platform'

interface MobileInfo {
  isNative: boolean
  platform: 'ios' | 'android' | 'web'
  isIOS: boolean
  isAndroid: boolean
  isWeb: boolean
  isLoading: boolean
}

export function useMobile(): MobileInfo {
  const [info, setInfo] = useState<MobileInfo>({
    isNative: false,
    platform: 'web',
    isIOS: false,
    isAndroid: false,
    isWeb: true,
    isLoading: true,
  })

  useEffect(() => {
    // Capacitor needs to be checked after mount
    setInfo({
      isNative: isNativePlatform(),
      platform: getPlatform(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isWeb: !isNativePlatform(),
      isLoading: false,
    })
  }, [])

  return info
}
