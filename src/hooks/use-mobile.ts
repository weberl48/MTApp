'use client'

import { useSyncExternalStore } from 'react'
import { isNativePlatform, getPlatform, isIOS, isAndroid } from '@/lib/capacitor/platform'

interface MobileInfo {
  isNative: boolean
  platform: 'ios' | 'android' | 'web'
  isIOS: boolean
  isAndroid: boolean
  isWeb: boolean
  isLoading: boolean
}

// Server snapshot (default values for SSR)
const serverSnapshot: MobileInfo = {
  isNative: false,
  platform: 'web',
  isIOS: false,
  isAndroid: false,
  isWeb: true,
  isLoading: true,
}

// Client snapshot (computed once on client)
let clientSnapshot: MobileInfo | null = null

function getClientSnapshot(): MobileInfo {
  if (clientSnapshot === null) {
    clientSnapshot = {
      isNative: isNativePlatform(),
      platform: getPlatform(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isWeb: !isNativePlatform(),
      isLoading: false,
    }
  }
  return clientSnapshot
}

function getServerSnapshot(): MobileInfo {
  return serverSnapshot
}

// Empty subscribe since platform info doesn't change
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function subscribe(_: () => void): () => void {
  return () => {}
}

export function useMobile(): MobileInfo {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
