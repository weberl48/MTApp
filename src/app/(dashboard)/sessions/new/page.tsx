import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionForm } from '@/components/forms/session-form'
import { ErrorState } from '@/components/ui/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function NewSessionPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/')
  }

  // Fetch service types and clients for the form
  const [
    { data: serviceTypes, error: serviceTypesError },
    { data: clients, error: clientsError },
  ] = await Promise.all([
    supabase.from('service_types').select('*').order('name'),
    supabase.from('clients').select('id, name, payment_method, requires_location').order('name'),
  ])

  if (serviceTypesError || clientsError) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Log New Session</h1>
          <p className="text-muted-foreground">
            Record a therapy session. All fields marked with * are required.
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardContent className="space-y-4">
            <ErrorState
              title="Couldn't load the session form"
              description="Check your connection and try again. Your data is safe."
            />
            <div className="flex justify-center">
              <Link href="/sessions/">
                <Button variant="outline">Back to Sessions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Log New Session</h1>
        <p className="text-muted-foreground">
          Record a therapy session. All fields marked with * are required.
        </p>
      </div>

      <div className="max-w-2xl">
        <SessionForm
          serviceTypes={serviceTypes || []}
          clients={clients || []}
          contractorId={user.id}
        />
      </div>
    </div>
  )
}
