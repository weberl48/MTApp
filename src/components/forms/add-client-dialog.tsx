'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addClient, updateClient, getDecryptedClientNotes } from '@/app/actions/clients'
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
import { Plus, Pencil, Mail } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import type { PaymentMethod, BillingMethod, BillingFrequency, Client } from '@/types/database'
import { useOrganization } from '@/contexts/organization-context'
import { getPaymentMethodOptions, getBillingMethodOptions } from '@/lib/constants/display'

interface ClientDialogProps {
  client?: Client
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function ClientDialog({ client, trigger, onSuccess }: ClientDialogProps) {
  const router = useRouter()
  const { organization, settings, feature } = useOrganization()
  const paymentMethods = getPaymentMethodOptions(settings)
  const billingMethods = getBillingMethodOptions(settings)
  const isEditMode = !!client

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('private_pay')
  const [billingMethod, setBillingMethod] = useState<BillingMethod>('square')
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('per_session')
  const [squareFeeEnabled, setSquareFeeEnabled] = useState(false)
  const [notes, setNotes] = useState('')
  const [sendInvite, setSendInvite] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (client && open) {
      setName(client.name)
      setEmail(client.contact_email || '')
      setPhone(client.contact_phone || '')
      setPaymentMethod(client.payment_method)
      setBillingMethod(client.billing_method || 'square')
      setBillingFrequency(client.billing_frequency || 'per_session')
      setSquareFeeEnabled(client.square_fee_enabled ?? false)
      // Notes are PHI (encrypted at rest) — fetch the decrypted value for editing.
      getDecryptedClientNotes(client.id)
        .then(setNotes)
        .catch(() => setNotes(client.notes || ''))
    }
  }, [client, open])

  function resetForm() {
    setName('')
    setEmail('')
    setPhone('')
    setPaymentMethod('private_pay')
    setBillingMethod('square')
    setBillingFrequency('per_session')
    setSquareFeeEnabled(false)
    setNotes('')
    setSendInvite(false)
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
        // Update via server action (encrypts PHI notes server-side)
        const result = await updateClient(client.id, {
          name: name.trim(),
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
          payment_method: paymentMethod,
          billing_method: billingMethod,
          billing_frequency: billingFrequency,
          square_fee_enabled: squareFeeEnabled,
          notes: notes.trim() || null,
        })

        if (!result.success) throw new Error(result.error)
        toast.success('Client updated successfully!')
      } else {
        // Create via server action (encrypts PHI notes server-side)
        const result = await addClient({
          name: name.trim(),
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
          payment_method: paymentMethod,
          billing_method: billingMethod,
          billing_frequency: billingFrequency,
          square_fee_enabled: squareFeeEnabled,
          notes: notes.trim() || null,
          organization_id: organization!.id,
        })

        if (!result.success) throw new Error(result.error)

        // Send portal invite if requested and email is provided
        if (sendInvite && email.trim()) {
          try {
            const response = await fetch(`/api/clients/${result.clientId}/send-invite/`, {
              method: 'POST',
            })
            if (response.ok) {
              toast.success(`Client added and portal invite sent to ${email.trim()}!`)
            } else {
              toast.success('Client added! (Failed to send invite - you can retry from client page)')
            }
          } catch {
            toast.success('Client added! (Failed to send invite - you can retry from client page)')
          }
        } else {
          toast.success('Client added successfully!')
        }
      }

      resetForm()
      setOpen(false)
      onSuccess?.()
      router.refresh()
    } catch {
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
              <Label htmlFor="billingMethod">Billing Method</Label>
              <Select
                value={billingMethod}
                onValueChange={(value) => setBillingMethod(value as BillingMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select billing method" />
                </SelectTrigger>
                <SelectContent>
                  {billingMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingFrequency">Invoicing</Label>
              <Select
                value={billingFrequency}
                onValueChange={(value) => setBillingFrequency(value as BillingFrequency)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select invoicing schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_session">Per session (invoice on approval)</SelectItem>
                  <SelectItem value="monthly">Monthly batch (one invoice at end of month)</SelectItem>
                </SelectContent>
              </Select>
              {billingFrequency === 'monthly' && (
                <p className="text-xs text-muted-foreground">
                  Sessions are held and combined into a single monthly invoice, generated from the
                  Scholarship &amp; Monthly tab on the Invoices page (or automatically, if enabled in Settings).
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="squareFee"
                checked={squareFeeEnabled}
                onCheckedChange={(checked) => setSquareFeeEnabled(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="squareFee" className="text-sm font-medium leading-none">
                  Add Square processing fee to invoices
                </label>
                <p className="text-xs text-muted-foreground">
                  Applies the fee configured in Settings &gt; Business Rules &gt; Invoices when this
                  client&apos;s invoices are sent via Square. You can remove it from an individual
                  invoice before sending.
                </p>
              </div>
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

            {/* Send Portal Invite Option (only for new clients with email, and portal enabled) */}
            {!isEditMode && feature('client_portal') && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="sendInvite"
                  checked={sendInvite}
                  onCheckedChange={(checked) => setSendInvite(checked === true)}
                  disabled={!email.trim()}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="sendInvite"
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 ${!email.trim() ? 'text-gray-400' : ''}`}
                  >
                    <Mail className="h-4 w-4" />
                    Send portal invite
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {email.trim()
                      ? 'Email client a link to access their portal'
                      : 'Enter an email address to enable this option'}
                  </p>
                </div>
              </div>
            )}
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
export function AddClientDialog({ trigger, onSuccess }: { trigger?: React.ReactNode; onSuccess?: () => void } = {}) {
  return <ClientDialog trigger={trigger} onSuccess={onSuccess} />
}
