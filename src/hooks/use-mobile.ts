'use client'

import { useSyncExternalStore } from 'react'

interface MobileInfo {
  isNative: boolean
  platform: 'ios' | 'android' | 'web'
  isIOS: boolean
  isAndroid: boolean
  isWeb: boolean
  isLoading: boolean
}

// For PWA, we're always on web platform
const webSnapshot: MobileInfo = {
  isNative: false,
  platform: 'web',
  isIOS: false,
  isAndroid: false,
  isWeb: true,
  isLoading: false,
}

function getSnapshot(): MobileInfo {
  return webSnapshot
}

// Empty subscribe since platform info doesn't change
function subscribe(): () => void {
  return () => {}
}

export function useMobile(): MobileInfo {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
