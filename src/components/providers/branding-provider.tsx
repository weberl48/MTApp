'use client'

import { useEffect } from 'react'
import { useOrganization } from '@/contexts/organization-context'

/**
 * Converts a hex color to OKLCH format for CSS variables
 * This is a simplified conversion - for full accuracy, a proper color library would be better
 */
function hexToOklchApprox(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '')

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  // Convert RGB to linear RGB
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  // Convert to XYZ
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb

  // Convert XYZ to OKLab
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const okb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  // Convert OKLab to OKLCH
  const C = Math.sqrt(a * a + okb * okb)
  let H = Math.atan2(okb, a) * 180 / Math.PI
  if (H < 0) H += 360

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
}

/**
 * Creates a lighter variant of a color for foreground text
 */
function createForegroundColor(hex: string, isDark: boolean): string {
  // For primary buttons, we want white or very light text
  // Using oklch with high lightness
  return isDark ? 'oklch(0.205 0 0)' : 'oklch(0.985 0 0)'
}

/**
 * Creates a hover/focus variant (slightly darker)
 */
function adjustBrightness(hex: string, factor: number): string {
  const cleanHex = hex.replace('#', '')
  const r = Math.min(255, Math.max(0, Math.round(parseInt(cleanHex.substring(0, 2), 16) * factor)))
  const g = Math.min(255, Math.max(0, Math.round(parseInt(cleanHex.substring(2, 4), 16) * factor)))
  const b = Math.min(255, Math.max(0, Math.round(parseInt(cleanHex.substring(4, 6), 16) * factor)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Checks if a color is considered "light" (for determining foreground color)
 */
function isLightColor(hex: string): boolean {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { organization } = useOrganization()

  useEffect(() => {
    if (!organization) return

    const { primary_color, secondary_color } = organization

    // Only apply if colors are set
    if (!primary_color) {
      // Remove any custom branding if no color is set
      document.documentElement.style.removeProperty('--primary')
      document.documentElement.style.removeProperty('--primary-foreground')
      document.documentElement.style.removeProperty('--sidebar-primary')
      document.documentElement.style.removeProperty('--sidebar-primary-foreground')
      document.documentElement.style.removeProperty('--ring')
      document.documentElement.style.removeProperty('--brand-primary')
      document.documentElement.style.removeProperty('--brand-secondary')
      return
    }

    // Convert hex colors to OKLCH for CSS variables
    const primaryOklch = hexToOklchApprox(primary_color)
    const secondaryOklch = secondary_color ? hexToOklchApprox(secondary_color) : primaryOklch

    // Determine if primary is light or dark for foreground color
    const primaryIsLight = isLightColor(primary_color)
    const primaryForeground = createForegroundColor(primary_color, primaryIsLight)

    // Apply CSS variables to the document root
    const root = document.documentElement

    // Primary color (used by buttons, links, etc.)
    root.style.setProperty('--primary', primaryOklch)
    root.style.setProperty('--primary-foreground', primaryForeground)

    // Sidebar primary (for active nav items)
    root.style.setProperty('--sidebar-primary', primaryOklch)
    root.style.setProperty('--sidebar-primary-foreground', primaryForeground)

    // Ring color (for focus states)
    root.style.setProperty('--ring', primaryOklch)

    // Store raw hex values for components that need direct access
    root.style.setProperty('--brand-primary', primary_color)
    root.style.setProperty('--brand-secondary', secondary_color || primary_color)

    // Cleanup function to remove custom properties when unmounting
    return () => {
      root.style.removeProperty('--primary')
      root.style.removeProperty('--primary-foreground')
      root.style.removeProperty('--sidebar-primary')
      root.style.removeProperty('--sidebar-primary-foreground')
      root.style.removeProperty('--ring')
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-secondary')
    }
  }, [organization])

  return <>{children}</>
}
