'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface PortalClient {
  id: string
  name: string
  contact_email: string | null
}

interface PortalOrganization {
  id: string
  name: string
  logo_url: string | null
  primary_color: string
}

interface PortalContextType {
  client: PortalClient | null
  organization: PortalOrganization | null
  token: string
  loading: boolean
  error: string | null
  isValid: boolean
}

const PortalContext = createContext<PortalContextType | null>(null)

interface PortalProviderProps {
  children: ReactNode
  token: string
}

export function PortalProvider({ children, token }: PortalProviderProps) {
  const [client, setClient] = useState<PortalClient | null>(null)
  const [organization, setOrganization] = useState<PortalOrganization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    async function validateToken() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/portal/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok || !data.valid) {
          setError(data.error || 'Invalid or expired link')
          setIsValid(false)
          return
        }

        setClient(data.client)
        setOrganization(data.organization)
        setIsValid(true)
      } catch {
        setError('Failed to validate access')
        setIsValid(false)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      validateToken()
    } else {
      setError('No access token provided')
      setLoading(false)
    }
  }, [token])

  return (
    <PortalContext.Provider
      value={{
        client,
        organization,
        token,
        loading,
        error,
        isValid,
      }}
    >
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return context
}
