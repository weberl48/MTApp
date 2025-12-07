import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionForm } from '@/components/forms/session-form'

export default async function NewSessionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch service types and clients for the form
  const [{ data: serviceTypes }, { data: clients }] = await Promise.all([
    supabase.from('service_types').select('*').order('name'),
    supabase.from('clients').select('id, name').order('name'),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log New Session</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Record a therapy session. All fields marked with * are required.
        </p>
      </div>

      <SessionForm
        serviceTypes={serviceTypes || []}
        clients={clients || []}
        contractorId={user.id}
      />
    </div>
  )
}
