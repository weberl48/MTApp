import { createServiceClient } from '@/lib/supabase/service'
import { ClientAccessToken } from '@/types/database'
import crypto from 'crypto'

const DEFAULT_EXPIRY_DAYS = 90

/**
 * Generate a cryptographically secure token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Calculate expiry date from now
 */
function calculateExpiryDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export interface TokenValidationResult {
  valid: boolean
  clientId?: string
  organizationId?: string
  client?: {
    id: string
    name: string
    contact_email: string | null
  }
  organization?: {
    id: string
    name: string
    logo_url: string | null
    primary_color: string
  }
  error?: string
}

export interface GeneratedToken {
  token: string
  expiresAt: string
  portalUrl: string
}

/**
 * Generate a new access token for a client
 */
export async function generateAccessToken(
  clientId: string,
  createdBy: string,
  organizationId: string,
  expiryDays: number = DEFAULT_EXPIRY_DAYS
): Promise<GeneratedToken> {
  const supabase = createServiceClient()

  const token = generateSecureToken()
  const expiresAt = calculateExpiryDate(expiryDays)

  const { error } = await supabase
    .from('client_access_tokens')
    .insert({
      client_id: clientId,
      token,
      expires_at: expiresAt,
      created_by: createdBy,
      organization_id: organizationId,
    })

  if (error) {
    throw new Error(`Failed to create access token: ${error.message}`)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const portalUrl = `${baseUrl}/portal/${token}`

  return {
    token,
    expiresAt,
    portalUrl,
  }
}

/**
 * Validate an access token and return client/organization info
 */
export async function validateAccessToken(token: string): Promise<TokenValidationResult> {
  const supabase = createServiceClient()

  // Find the token
  const { data: tokenData, error: tokenError } = await supabase
    .from('client_access_tokens')
    .select(`
      id,
      client_id,
      organization_id,
      expires_at,
      is_revoked,
      client:clients(id, name, contact_email),
      organization:organizations(id, name, logo_url, primary_color)
    `)
    .eq('token', token)
    .single()

  if (tokenError || !tokenData) {
    return { valid: false, error: 'Token not found' }
  }

  // Check if revoked
  if (tokenData.is_revoked) {
    return { valid: false, error: 'Token has been revoked' }
  }

  // Check if expired
  const expiresAt = new Date(tokenData.expires_at)
  if (expiresAt < new Date()) {
    return { valid: false, error: 'Token has expired' }
  }

  // Update last accessed time
  await supabase
    .from('client_access_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', tokenData.id)

  // Relations come back as arrays from the join, take the first element
  const client = Array.isArray(tokenData.client) ? tokenData.client[0] : tokenData.client
  const organization = Array.isArray(tokenData.organization) ? tokenData.organization[0] : tokenData.organization

  return {
    valid: true,
    clientId: tokenData.client_id,
    organizationId: tokenData.organization_id,
    client: client as TokenValidationResult['client'],
    organization: organization as TokenValidationResult['organization'],
  }
}

/**
 * Revoke an access token
 */
export async function revokeAccessToken(tokenId: string): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('client_access_tokens')
    .update({ is_revoked: true })
    .eq('id', tokenId)

  if (error) {
    throw new Error(`Failed to revoke token: ${error.message}`)
  }
}

/**
 * Revoke all tokens for a client
 */
export async function revokeAllClientTokens(clientId: string): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('client_access_tokens')
    .update({ is_revoked: true })
    .eq('client_id', clientId)
    .eq('is_revoked', false)

  if (error) {
    throw new Error(`Failed to revoke tokens: ${error.message}`)
  }
}

/**
 * Get all active tokens for a client
 */
export async function getClientTokens(clientId: string): Promise<ClientAccessToken[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('client_access_tokens')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_revoked', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get tokens: ${error.message}`)
  }

  return data || []
}

/**
 * Find a client by email and send them a magic link
 * Returns the client if found, null if not found
 */
export async function findClientByEmail(
  email: string,
  organizationId?: string
): Promise<{ clientId: string; organizationId: string } | null> {
  const supabase = createServiceClient()

  let query = supabase
    .from('clients')
    .select('id, organization_id')
    .eq('contact_email', email.toLowerCase().trim())

  // If organization is specified, filter by it
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query.limit(1).single()

  if (error || !data) {
    return null
  }

  return {
    clientId: data.id,
    organizationId: data.organization_id,
  }
}

/**
 * Get or create a valid token for a client
 * Reuses existing valid token if available, creates new one otherwise
 */
export async function getOrCreateClientToken(
  clientId: string,
  organizationId: string,
  expiryDays: number = DEFAULT_EXPIRY_DAYS
): Promise<GeneratedToken> {
  const supabase = createServiceClient()

  // Check for existing valid token
  const { data: existingToken } = await supabase
    .from('client_access_tokens')
    .select('token, expires_at')
    .eq('client_id', clientId)
    .eq('is_revoked', false)
    .gte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .single()

  if (existingToken) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return {
      token: existingToken.token,
      expiresAt: existingToken.expires_at,
      portalUrl: `${baseUrl}/portal/${existingToken.token}`,
    }
  }

  // No valid token exists - we need a user ID to create one
  // For magic link requests, we'll use a system user or the first admin
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', organizationId)
    .in('role', ['admin', 'owner', 'developer'])
    .limit(1)
    .single()

  if (!adminUser) {
    throw new Error('No admin user found to create token')
  }

  return generateAccessToken(clientId, adminUser.id, organizationId, expiryDays)
}
