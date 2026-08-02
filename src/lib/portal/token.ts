import { createServiceClient } from '@/lib/supabase/service'
import type { ClientAccessToken, OrganizationSettings } from '@/types/database'
import crypto from 'crypto'

const DEFAULT_EXPIRY_DAYS = 90

/**
 * Generate a cryptographically secure token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Hash a portal token for storage/lookup.
 *
 * The token is a 90-day bearer credential for a client's PHI, so the database
 * stores only its hash — a DB compromise, a backup, or the cert copy of
 * production must not yield working portal access. The raw token exists only in
 * the emailed link.
 *
 * SHA-256 rather than a slow KDF on purpose: the input is 256 bits of CSPRNG
 * output, so there is no guessing to slow down, and this runs on every portal
 * request.
 *
 * MUST match the backfill in supabase/migrations/20260802_hash_portal_tokens.sql
 * (`encode(digest(token,'sha256'),'hex')`).
 */
export function hashPortalToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
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
      // Only the hash is persisted; `token` below is returned to the caller so it
      // can be put in the emailed link, and is never written.
      token_hash: hashPortalToken(token),
      expires_at: expiresAt,
      created_by: createdBy,
      organization_id: organizationId,
    })

  if (error) {
    throw new Error(`Failed to create access token: ${error.message}`)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL is required in production')
  }
  const appUrl = baseUrl || 'http://localhost:3000'
  const portalUrl = `${appUrl}/portal/${token}`

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
      organization:organizations(id, name, logo_url, primary_color, settings)
    `)
    .eq('token_hash', hashPortalToken(token))
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

  // Relations come back as arrays from the join, take the first element
  const client = Array.isArray(tokenData.client) ? tokenData.client[0] : tokenData.client
  const organization = Array.isArray(tokenData.organization) ? tokenData.organization[0] : tokenData.organization

  // Check if the client portal feature is enabled for this organization
  const orgSettings = (organization as { settings?: OrganizationSettings })?.settings
  if (orgSettings?.features?.client_portal === false) {
    return { valid: false, error: 'The client portal is currently unavailable' }
  }

  // Update last accessed time
  await supabase
    .from('client_access_tokens')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', tokenData.id)

  return {
    valid: true,
    clientId: tokenData.client_id,
    organizationId: tokenData.organization_id,
    client: client as TokenValidationResult['client'],
    organization: {
      id: (organization as { id: string }).id,
      name: (organization as { name: string }).name,
      logo_url: (organization as { logo_url: string | null }).logo_url,
      primary_color: (organization as { primary_color: string }).primary_color,
    },
  }
}

/**
 * Revoke an access token. `clientId` is required: the service client bypasses
 * RLS, so the token must be proven to belong to the client the caller was
 * authorized for — otherwise a guessed token id could revoke across tenants.
 */
export async function revokeAccessToken(tokenId: string, clientId: string): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('client_access_tokens')
    .update({ is_revoked: true })
    .eq('id', tokenId)
    .eq('client_id', clientId)

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
 * A portal token as shown in a staff listing — metadata only.
 * Deliberately omits `token` and `token_hash`: this shape is serialized to the
 * browser and neither the credential nor its hash belongs there.
 */
export type ClientAccessTokenSummary = Omit<ClientAccessToken, 'token' | 'token_hash'>

/**
 * Get all active tokens for a client (metadata only — no credential material).
 */
export async function getClientTokens(clientId: string): Promise<ClientAccessTokenSummary[]> {
  const supabase = createServiceClient()

  // Explicit column list, not `*`: this result is serialized straight to the
  // browser by /api/clients/[id]/access-token, and `*` used to ship the raw
  // bearer token with it. Neither the token nor its hash belongs in a listing.
  const { data, error } = await supabase
    .from('client_access_tokens')
    .select('id, client_id, organization_id, expires_at, last_accessed_at, is_revoked, created_by, created_at, updated_at')
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

  // No "reuse the existing token" path any more: tokens are stored hashed, so
  // the raw value is unrecoverable by design. Each magic-link request therefore
  // mints a fresh credential.
  //
  // Previously-issued tokens are deliberately NOT revoked here — that matches
  // the existing behaviour when staff generate a second link, and avoids a
  // client's own re-request silently breaking a link an admin just sent them.
  // They still age out at expires_at.

  // We need a user ID to attribute the token to.
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
