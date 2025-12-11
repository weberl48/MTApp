import { createClient } from './client'

export interface MfaFactor {
  id: string
  factor_type: 'totp'
  friendly_name?: string
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

export interface EnrollMfaResponse {
  id: string
  type: 'totp'
  totp: {
    qr_code: string
    secret: string
    uri: string
  }
}

/**
 * Get the user's current MFA factors
 */
export async function getMfaFactors(): Promise<MfaFactor[]> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.listFactors()

  if (error) {
    console.error('Error listing MFA factors:', error)
    return []
  }

  return data?.totp || []
}

/**
 * Check if user has MFA enabled (has at least one verified TOTP factor)
 */
export async function hasMfaEnabled(): Promise<boolean> {
  const factors = await getMfaFactors()
  return factors.some((f) => f.status === 'verified')
}

/**
 * Start MFA enrollment - returns QR code and secret
 */
export async function enrollMfa(friendlyName?: string): Promise<EnrollMfaResponse | null> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: friendlyName || 'Authenticator App',
  })

  if (error) {
    console.error('Error enrolling MFA:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Verify MFA enrollment with a TOTP code
 */
export async function verifyMfaEnrollment(factorId: string, code: string): Promise<boolean> {
  const supabase = createClient()

  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  })

  if (challengeError) {
    console.error('Error creating MFA challenge:', challengeError)
    throw new Error(challengeError.message)
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  })

  if (verifyError) {
    console.error('Error verifying MFA:', verifyError)
    throw new Error(verifyError.message)
  }

  return true
}

/**
 * Unenroll (disable) MFA for a factor
 */
export async function unenrollMfa(factorId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  })

  if (error) {
    console.error('Error unenrolling MFA:', error)
    throw new Error(error.message)
  }

  return true
}

/**
 * Create a challenge for MFA verification during login
 */
export async function createMfaChallenge(factorId: string): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.mfa.challenge({
    factorId,
  })

  if (error) {
    console.error('Error creating MFA challenge:', error)
    throw new Error(error.message)
  }

  return data.id
}

/**
 * Verify MFA during login
 */
export async function verifyMfaChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  })

  if (error) {
    console.error('Error verifying MFA challenge:', error)
    throw new Error(error.message)
  }

  return true
}

/**
 * Get the current AAL (Authenticator Assurance Level)
 * - aal1: Password verified only
 * - aal2: Password + MFA verified
 */
export async function getAuthenticatorAssuranceLevel(): Promise<'aal1' | 'aal2' | null> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (error) {
    console.error('Error getting AAL:', error)
    return null
  }

  return data?.currentLevel || null
}

/**
 * Check if user needs to complete MFA verification
 * Returns true if user has MFA enabled but hasn't completed verification for current session
 */
export async function needsMfaVerification(): Promise<{ needsVerification: boolean; factorId?: string }> {
  const supabase = createClient()

  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (aalError || !aalData) {
    return { needsVerification: false }
  }

  // If current level is aal1 but next level is aal2, user needs to verify MFA
  if (aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
    // Get the first verified factor
    const factors = await getMfaFactors()
    const verifiedFactor = factors.find((f) => f.status === 'verified')

    if (verifiedFactor) {
      return { needsVerification: true, factorId: verifiedFactor.id }
    }
  }

  return { needsVerification: false }
}
