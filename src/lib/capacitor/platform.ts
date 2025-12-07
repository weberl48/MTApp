import { Capacitor } from '@capacitor/core'

// Check if running in native app (iOS/Android)
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

// Get current platform: 'ios', 'android', or 'web'
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}

// Check if running on iOS
export function isIOS(): boolean {
  return getPlatform() === 'ios'
}

// Check if running on Android
export function isAndroid(): boolean {
  return getPlatform() === 'android'
}

// Check if running on web (browser)
export function isWeb(): boolean {
  return getPlatform() === 'web'
}
