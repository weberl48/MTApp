'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Calculator } from 'lucide-react'
import { calculateSessionPricing, formatCurrency, getPricingDescription } from '@/lib/pricing'
import type { ServiceType, Client } from '@/types/database'
import { toast } from 'sonner'

interface SessionFormProps {
  serviceTypes: ServiceType[]
  clients: Array<Pick<Client, 'id' | 'name'>>
  contractorId: string
}

export function SessionForm({ serviceTypes, clients, contractorId }: SessionFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState('30')
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'draft' | 'submitted'>('submitted')

  // Get selected service type for pricing calculation
  const selectedServiceType = serviceTypes.find((st) => st.id === serviceTypeId)

  // Calculate pricing whenever service type or clients change
  const pricing = selectedServiceType && selectedClients.length > 0
    ? calculateSessionPricing(selectedServiceType, selectedClients.length)
    : null

  function addClient(clientId: string) {
    if (!selectedClients.includes(clientId)) {
      setSelectedClients([...selectedClients, clientId])
    }
  }

  function removeClient(clientId: string) {
    setSelectedClients(selectedClients.filter((id) => id !== clientId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!serviceTypeId) {
      toast.error('Please select a service type')
      return
    }

    if (selectedClients.length === 0) {
      toast.error('Please add at least one client')
      return
    }

    setLoading(true)

    try {
      // Create the session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          date,
          duration_minutes: parseInt(duration),
          service_type_id: serviceTypeId,
          contractor_id: contractorId,
          status,
          notes: notes || null,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Add attendees
      const attendees = selectedClients.map((clientId) => ({
        session_id: session.id,
        client_id: clientId,
        individual_cost: pricing?.perPersonCost || 0,
      }))

      const { error: attendeesError } = await supabase
        .from('session_attendees')
        .insert(attendees)

      if (attendeesError) throw attendeesError

      // If submitted, create invoices for each client
      if (status === 'submitted' && pricing) {
        const clientData = await supabase
          .from('clients')
          .select('id, payment_method')
          .in('id', selectedClients)

        const invoices = (clientData.data || []).map((client) => ({
          session_id: session.id,
          client_id: client.id,
          amount: pricing.perPersonCost,
          mca_cut: pricing.mcaCut / selectedClients.length,
          contractor_pay: pricing.contractorPay / selectedClients.length,
          rent_amount: pricing.rentAmount / selectedClients.length,
          payment_method: client.payment_method,
          status: 'pending' as const,
        }))

        const { error: invoicesError } = await supabase
          .from('invoices')
          .insert(invoices)

        if (invoicesError) {
          console.error('Error creating invoices:', invoicesError)
          // Don't fail the whole submission, just log the error
        }
      }

      toast.success('Session logged successfully!')
      router.push('/sessions')
      router.refresh()
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  // Get client name by ID
  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown'
  }

  // Filter out already selected clients
  const availableClients = clients.filter((c) => !selectedClients.includes(c.id))

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedServiceType && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getPricingDescription(selectedServiceType)}
              </p>
            )}
          </div>

          {/* Clients */}
          <div className="space-y-2">
            <Label>Clients *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedClients.map((clientId) => (
                <Badge
                  key={clientId}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {getClientName(clientId)}
                  <button
                    type="button"
                    onClick={() => removeClient(clientId)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {availableClients.length > 0 && (
              <Select onValueChange={addClient} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Add a client..." />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {clients.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No clients found. Please add clients first.
              </p>
            )}
          </div>

          {/* Pricing Preview */}
          {pricing && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Pricing Breakdown
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(pricing.totalAmount)}</span>

                  <span className="text-gray-600 dark:text-gray-400">Per Person:</span>
                  <span className="font-medium">{formatCurrency(pricing.perPersonCost)}</span>

                  <span className="text-gray-600 dark:text-gray-400">MCA Cut:</span>
                  <span className="font-medium">{formatCurrency(pricing.mcaCut)}</span>

                  <span className="text-gray-600 dark:text-gray-400">Contractor Pay:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(pricing.contractorPay)}
                  </span>

                  {pricing.rentAmount > 0 && (
                    <>
                      <span className="text-gray-600 dark:text-gray-400">Rent:</span>
                      <span className="font-medium">{formatCurrency(pricing.rentAmount)}</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Save as</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="submitted"
                  checked={status === 'submitted'}
                  onChange={() => setStatus('submitted')}
                  className="w-4 h-4"
                />
                <span>Submit for approval</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="w-4 h-4"
                />
                <span>Save as draft</span>
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : status === 'submitted' ? 'Submit Session' : 'Save Draft'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
