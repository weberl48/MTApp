'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  presets?: string[]
  className?: string
}

const DEFAULT_PRESETS = [
  '#3b82f6', // Blue
  '#1e40af', // Dark Blue
  '#8b5cf6', // Purple
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#64748b', // Slate
  '#000000', // Black
  '#ffffff', // White
]

export function ColorPicker({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
}: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    // Only update parent if it's a valid hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue)
    }
  }

  const handlePresetClick = (color: string) => {
    setLocalValue(color)
    onChange(color)
  }

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange(newValue)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <div
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: localValue }}
            />
            <span className="text-muted-foreground font-mono">{localValue}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            {/* Color presets grid */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Presets</Label>
              <div className="grid grid-cols-7 gap-1">
                {presets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handlePresetClick(color)}
                    className={cn(
                      'w-7 h-7 rounded border-2 transition-all hover:scale-110',
                      localValue === color
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Custom color input */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Custom</Label>
                <Input
                  type="text"
                  value={localValue}
                  onChange={handleInputChange}
                  placeholder="#000000"
                  className="font-mono text-sm h-9"
                  maxLength={7}
                />
              </div>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="color"
                  value={localValue}
                  onChange={handleColorPickerChange}
                  className="w-9 h-9 p-0 border-0 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
