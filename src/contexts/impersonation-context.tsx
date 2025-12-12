'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ImpersonatedContractor {
  id: string
  name: string
}

interface ImpersonatedClient {
  id: string
  name: string
  portalToken?: string
}

interface ImpersonationContextType {
  // Contractor impersonation
  impersonatedContractor: ImpersonatedContractor | null
  setImpersonatedContractor: (contractor: ImpersonatedContractor | null) => void
  isImpersonatingContractor: boolean
  // Client impersonation (view as client)
  impersonatedClient: ImpersonatedClient | null
  setImpersonatedClient: (client: ImpersonatedClient | null) => void
  isImpersonatingClient: boolean
  // General
  clearImpersonation: () => void
  isImpersonating: boolean
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined)

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedContractor, setImpersonatedContractor] = useState<ImpersonatedContractor | null>(null)
  const [impersonatedClient, setImpersonatedClient] = useState<ImpersonatedClient | null>(null)

  const clearImpersonation = useCallback(() => {
    setImpersonatedContractor(null)
    setImpersonatedClient(null)
  }, [])

  const value: ImpersonationContextType = {
    impersonatedContractor,
    setImpersonatedContractor,
    isImpersonatingContractor: impersonatedContractor !== null,
    impersonatedClient,
    setImpersonatedClient,
    isImpersonatingClient: impersonatedClient !== null,
    clearImpersonation,
    isImpersonating: impersonatedContractor !== null || impersonatedClient !== null,
  }

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext)
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider')
  }
  return context
}
