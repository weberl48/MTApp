import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service client type - using any for flexibility with new tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = SupabaseClient<any, 'public', any>

let serviceClient: ServiceClient | null = null

/**
 * Create a Supabase client with the service role key
 *
 * IMPORTANT: This client bypasses Row Level Security (RLS) policies.
 * Only use this for:
 * - Server-side operations that need to access data across organizations
 * - Portal API routes where the user doesn't have a Supabase auth session
 * - Background jobs and cron tasks
 *
 * Never expose this client to the browser or use it in client components.
 */
export function createServiceClient(): ServiceClient {
  if (serviceClient) {
    return serviceClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceClient
}
