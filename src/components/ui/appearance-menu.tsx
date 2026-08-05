'use client'

import { useTheme } from 'next-themes'
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { THEMES } from '@/lib/themes'
import { useAppTheme } from '@/lib/themes/use-app-theme'
import { cn } from '@/lib/utils'

const MODES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

/**
 * The Mode + Theme picker body, with no popover/trigger of its own — shared
 * by the desktop header's Popover (`AppearanceMenu` below) and the mobile
 * avatar menu's Appearance submenu, which has nowhere to put a nested
 * popover trigger and just wants this content inline.
 */
export function AppearanceMenuContent() {
  const { theme: mode, setTheme: setMode, resolvedTheme } = useTheme()
  const { theme, setTheme } = useAppTheme()

  // Wait for client-side hydration - resolvedTheme is undefined during SSR.
  if (typeof resolvedTheme === 'undefined') {
    return <p className="p-2 text-xs text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Mode</p>
        <div className="grid grid-cols-3 gap-1">
          {MODES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={mode === value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              <Icon className="h-3.5 w-3.5 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Theme</p>
        <div className="grid grid-cols-2 gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              title={t.description}
              className={cn(
                'flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-sm transition-colors',
                'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                theme === t.id ? 'border-primary bg-accent' : 'border-border',
              )}
            >
              <span className="flex shrink-0 -space-x-1">
                {t.swatch.map((color, i) => (
                  <span
                    key={i}
                    className="h-3.5 w-3.5 rounded-full border border-black/10 dark:border-white/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="flex-1 truncate">{t.label}</span>
              {theme === t.id && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Personal preference, saved in this browser. Clients always see your
          practice branding.
        </p>
      </div>
    </div>
  )
}

/**
 * Header Appearance popover: light/dark/system mode plus the theme picker.
 * Theme choice is personal (stored in this browser only) and never affects
 * what clients see — the portal keeps organization branding.
 */
export function AppearanceMenu() {
  const { resolvedTheme } = useTheme()

  // Wait for client-side hydration - resolvedTheme is undefined during SSR.
  // Placeholder matches the real trigger's size and label so there is no
  // layout shift and assistive tech doesn't encounter an unnamed dead button.
  if (typeof resolvedTheme === 'undefined') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 disabled:opacity-100"
        disabled
        aria-label="Appearance"
      >
        <Palette className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Appearance">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <AppearanceMenuContent />
      </PopoverContent>
    </Popover>
  )
}
