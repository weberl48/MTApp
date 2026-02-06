'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Shield, ShieldCheck, ShieldOff, Loader2, QrCode, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  getMfaFactors,
  enrollMfa,
  verifyMfaEnrollment,
  unenrollMfa,
  type MfaFactor,
  type EnrollMfaResponse,
} from '@/lib/supabase/mfa'

export function MfaSetup() {
  const [loading, setLoading] = useState(true)
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [enrollmentData, setEnrollmentData] = useState<EnrollMfaResponse | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [factorToDisable, setFactorToDisable] = useState<string | null>(null)

  const hasMfa = factors.some((f) => f.status === 'verified')

  useEffect(() => {
    loadFactors()
  }, [])

  async function loadFactors() {
    setLoading(true)
    try {
      const data = await getMfaFactors()
      setFactors(data)
    } catch (error) {
      console.error('[MCA] Error loading MFA factors')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll() {
    try {
      setLoading(true)
      const data = await enrollMfa()
      setEnrollmentData(data)
      setShowEnrollDialog(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start MFA enrollment')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyEnrollment() {
    if (!enrollmentData || !verificationCode) return

    setVerifying(true)
    try {
      await verifyMfaEnrollment(enrollmentData.id, verificationCode)
      toast.success('Two-factor authentication enabled successfully!')
      setShowEnrollDialog(false)
      setEnrollmentData(null)
      setVerificationCode('')
      await loadFactors()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid verification code')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDisable() {
    if (!factorToDisable) return

    setLoading(true)
    try {
      await unenrollMfa(factorToDisable)
      toast.success('Two-factor authentication disabled')
      setShowDisableDialog(false)
      setFactorToDisable(null)
      await loadFactors()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable MFA')
    } finally {
      setLoading(false)
    }
  }

  function openDisableDialog(factorId: string) {
    setFactorToDisable(factorId)
    setShowDisableDialog(true)
  }

  if (loading && factors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasMfa ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a verification code from
            your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasMfa ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      2FA is enabled
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your account is protected with two-factor authentication
                    </p>
                  </div>
                </div>
              </div>

              {factors.filter((f) => f.status === 'verified').map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{factor.friendly_name || 'Authenticator App'}</p>
                      <p className="text-sm text-gray-500">
                        Added {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => openDisableDialog(factor.id)}
                  >
                    <ShieldOff className="h-4 w-4 mr-1" />
                    Disable
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      2FA is not enabled
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Enable two-factor authentication for additional security
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleEnroll} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {enrollmentData?.totp.qr_code && (
              <div className="flex justify-center p-4 bg-white dark:bg-gray-100 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrollmentData.totp.qr_code}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Can&apos;t scan? Enter this code manually:
              </p>
              <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono break-all">
                {enrollmentData?.totp.secret}
              </code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode">Enter verification code</Label>
              <Input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowEnrollDialog(false)
                  setEnrollmentData(null)
                  setVerificationCode('')
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleVerifyEnrollment}
                disabled={verificationCode.length !== 6 || verifying}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Verify & Enable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              This will remove the extra layer of security from your account. You can re-enable it
              at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowDisableDialog(false)
                setFactorToDisable(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDisable}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldOff className="h-4 w-4 mr-2" />
              )}
              Disable 2FA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
