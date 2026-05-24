'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Check if running in standalone mode (installed PWA)
function getIsStandalone() {
  if (typeof window === 'undefined') return true // Assume installed on server to avoid flash
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

function subscribeToStandalone(callback: () => void) {
  const mediaQuery = window.matchMedia('(display-mode: standalone)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

// Check if iOS device
function getIsIOS() {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

// Check if mobile/tablet device (only show install prompt on these)
function getIsMobileDevice() {
  if (typeof window === 'undefined') return false
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024)
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  // Use useSyncExternalStore for standalone mode check (avoids setState in effect)
  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    getIsStandalone,
    () => true // Server returns true to avoid flash
  )

  const isIOS = getIsIOS()
  const isMobile = getIsMobileDevice()

  useEffect(() => {
    // Don't show on desktop/laptop browsers
    if (!isMobile) return

    // Don't run if already standalone
    if (isStandalone) return

    // Check if user has dismissed the prompt recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show manual instructions after a delay on first visit
    if (isIOS) {
      const hasSeenIOSPrompt = localStorage.getItem('pwa-ios-prompt-shown')
      if (!hasSeenIOSPrompt) {
        const timer = setTimeout(() => setShowPrompt(true), 3000)
        return () => {
          clearTimeout(timer)
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [isStandalone, isIOS, isMobile])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    if (isIOS) {
      localStorage.setItem('pwa-ios-prompt-shown', 'true')
    }
  }

  // Don't show on desktop or if already installed
  if (!isMobile || isStandalone || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Install MCA Manager
            </h3>
            {isIOS ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tap the share button <span className="inline-block px-1">&#x2191;</span> then &quot;Add to Home Screen&quot;
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Install the app for quick access and offline support
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {!isIOS && deferredPrompt && (
                <Button size="sm" onClick={handleInstall}>
                  Install
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                {isIOS ? 'Got it' : 'Not now'}
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
