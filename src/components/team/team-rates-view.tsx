'use client'

// NOTE: pay_increase functionality disabled — rates are now managed via PayRateMatrix.
// Keeping component for backward compatibility. pay_increase code commented out below.

// import { useState } from 'react'
// import { createClient } from '@/lib/supabase/client'
// import { formatCurrency } from '@/lib/pricing'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
// import { Pencil, Check, X, Loader2, ExternalLink } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
// import { toast } from 'sonner'
import Link from 'next/link'

interface Contractor {
  id: string
  name: string | null
  email: string
  // pay_increase: number  // NOTE: disabled — managed via PayRateMatrix
}

interface TeamRatesViewProps {
  contractors: Contractor[]
  canEdit: boolean
}

export function TeamRatesView({ contractors }: TeamRatesViewProps) {
  // NOTE: pay_increase editing state disabled — managed via PayRateMatrix
  // const [editingId, setEditingId] = useState<string | null>(null)
  // const [editValue, setEditValue] = useState('')
  // const [saving, setSaving] = useState(false)
  // const [localValues, setLocalValues] = useState<Record<string, number>>(() => {
  //   const map: Record<string, number> = {}
  //   contractors.forEach((c) => {
  //     map[c.id] = c.pay_increase
  //   })
  //   return map
  // })

  // function startEditing(contractor: Contractor) {
  //   setEditingId(contractor.id)
  //   setEditValue((localValues[contractor.id] ?? contractor.pay_increase).toString())
  // }

  // function cancelEditing() {
  //   setEditingId(null)
  //   setEditValue('')
  // }

  // async function handleSave(contractorId: string) {
  //   setSaving(true)
  //   const supabase = createClient()
  //   const newValue = parseFloat(editValue) || 0
  //
  //   const { error } = await supabase
  //     .from('users')
  //     .update({ pay_increase: newValue, updated_at: new Date().toISOString() })
  //     .eq('id', contractorId)
  //
  //   if (error) {
  //     toast.error('Failed to update pay increase')
  //   } else {
  //     toast.success('Pay increase updated')
  //     setLocalValues((prev) => ({ ...prev, [contractorId]: newValue }))
  //   }
  //
  //   setSaving(false)
  //   setEditingId(null)
  // }

  if (contractors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No contractors found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contractor</TableHead>
          {/* NOTE: Pay Increase column disabled — managed via PayRateMatrix */}
          {/* <TableHead>Pay Increase</TableHead> */}
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contractors.map((contractor) => {
          // const currentValue = localValues[contractor.id] ?? contractor.pay_increase
          // const isEditing = editingId === contractor.id

          return (
            <TableRow key={contractor.id}>
              <TableCell>
                <div className="font-medium">{contractor.name || 'Unnamed'}</div>
                <div className="text-sm text-gray-500">{contractor.email}</div>
              </TableCell>
              {/* NOTE: Pay Increase cell disabled — managed via PayRateMatrix
              <TableCell>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">$</span>
                    <Input
                      type="number"
                      step="0.50"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(contractor.id)
                        if (e.key === 'Escape') cancelEditing()
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSave(contractor.id)}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${currentValue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {currentValue > 0 ? `+${formatCurrency(currentValue)}` : '$0.00'}
                    </span>
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(contractor)}
                        className="h-7 w-7"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
              */}
              <TableCell>
                <Link
                  href={`/team/${contractor.id}`}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  All rates
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
