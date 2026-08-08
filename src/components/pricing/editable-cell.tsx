'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check, X, Pencil } from 'lucide-react'
import { toast } from 'sonner'

export interface EditableCellProps {
  value: number | null
  display?: string
  emptyDisplay?: string
  placeholder?: string
  canEdit: boolean
  nullable?: boolean
  min?: number
  step?: string
  onSave: (value: number | null) => Promise<void>
}

/**
 * Click-to-edit table cell: display span (+ pencil on hover) → inline number
 * input with Enter=save / Escape=cancel. Modeled on PayRateMatrix's cell
 * interaction (src/components/team/pay-rate-matrix.tsx:518-614).
 */
export function EditableCell(props: EditableCellProps) {
  const {
    value,
    display,
    emptyDisplay = '—',
    placeholder,
    canEdit,
    nullable = false,
    min,
    step = '0.50',
    onSave,
  } = props

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  function startEditing() {
    setEditValue(value != null ? String(value) : '')
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditValue('')
  }

  async function save() {
    const trimmed = editValue.trim()

    if (trimmed === '') {
      if (!nullable) {
        toast.error('Please enter a valid amount')
        return
      }
      setSaving(true)
      await onSave(null)
      setSaving(false)
      cancelEditing()
      return
    }

    const parsed = parseFloat(trimmed)
    const minimum = min ?? 0
    if (isNaN(parsed) || parsed < minimum) {
      toast.error('Please enter a valid amount')
      return
    }

    setSaving(true)
    await onSave(parsed)
    setSaving(false)
    cancelEditing()
  }

  if (isEditing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <Input
          type="number"
          step={step}
          min={min ?? 0}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="w-20 h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancelEditing()
          }}
        />
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3 text-success" />
          )}
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditing} disabled={saving}>
          <X className="w-3 h-3 text-muted-foreground" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-0.5 group">
      <span className="text-sm">{value === null ? emptyDisplay : (display ?? String(value))}</span>
      {canEdit && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={startEditing}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}
