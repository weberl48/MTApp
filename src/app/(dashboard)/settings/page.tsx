import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProfileForm } from '@/components/forms/profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  const isAdmin = userProfile?.role === 'admin'

  // Get service types for admin
  let serviceTypes = null
  if (isAdmin) {
    const { data } = await supabase.from('service_types').select('*').order('name')
    serviceTypes = data
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={userProfile || { id: authUser.id, email: authUser.email || '', name: '', role: 'contractor', phone: null, payment_info: null, created_at: '', updated_at: '' }} />
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{authUser.email}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userProfile?.role === 'admin' ? 'Administrator' : 'Contractor'}
              </p>
            </div>
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {userProfile?.role || 'contractor'}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Member Since</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userProfile?.created_at
                  ? new Date(userProfile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Types (Admin Only) */}
      {isAdmin && serviceTypes && (
        <Card>
          <CardHeader>
            <CardTitle>Service Types</CardTitle>
            <CardDescription>Current pricing configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceTypes.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{st.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ${st.base_rate}
                      {st.per_person_rate > 0 && ` + $${st.per_person_rate}/person`}
                      {' • '}{st.mca_percentage}% MCA
                      {st.contractor_cap && ` • Max $${st.contractor_cap}`}
                      {st.rent_percentage > 0 && ` • ${st.rent_percentage}% rent`}
                    </p>
                  </div>
                  <Badge variant="outline">{st.location}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
