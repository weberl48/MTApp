'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { PaymentMethod, Client } from '@/types/database'
import { useOrganization } from '@/contexts/organization-context'

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'private_pay', label: 'Private Pay (Cash/Check)' },
  { value: 'self_directed', label: 'Self-Directed Reimbursement' },
  { value: 'group_home', label: 'Group Home Billing' },
  { value: 'scholarship', label: 'Scholarship Fund' },
]

interface ClientDialogProps {
  client?: Client
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function ClientDialog({ client, trigger, onSuccess }: ClientDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const { organization } = useOrganization()
  const isEditMode = !!client

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('private_pay')
  const [notes, setNotes] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (client && open) {
      setName(client.name)
      setEmail(client.contact_email || '')
      setPhone(client.contact_phone || '')
      setPaymentMethod(client.payment_method)
      setNotes(client.notes || '')
    }
  }, [client, open])

  function resetForm() {
    setName('')
    setEmail('')
    setPhone('')
    setPaymentMethod('private_pay')
    setNotes('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Client name is required')
      return
    }

    setLoading(true)

    try {
      if (isEditMode) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: name.trim(),
            contact_email: email.trim() || null,
            contact_phone: phone.trim() || null,
            payment_method: paymentMethod,
            notes: notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', client.id)

        if (error) throw error
        toast.success('Client updated successfully!')
      } else {
        // Create new client
        const { error } = await supabase.from('clients').insert({
          name: name.trim(),
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
          organization_id: organization!.id,
        })

        if (error) throw error
        toast.success('Client added successfully!')
      }

      resetForm()
      setOpen(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error(isEditMode ? 'Failed to update client' : 'Failed to add client')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = isEditMode ? (
    <Button variant="ghost" size="sm">
      <Pencil className="w-4 h-4" />
    </Button>
  ) : (
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      Add Client
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update client information.'
                : 'Add a new client to your practice. You can add their contact and billing information.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Client name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this client..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEditMode ? 'Updating...' : 'Adding...'
                : isEditMode ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Backward-compatible alias for existing imports
export function AddClientDialog() {
  return <ClientDialog />
}
