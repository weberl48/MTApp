'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ImpersonatedContractor {
  id: string
  name: string
}

interface ImpersonationContextType {
  // Contractor impersonation
  impersonatedContractor: ImpersonatedContractor | null
  setImpersonatedContractor: (contractor: ImpersonatedContractor | null) => void
  isImpersonatingContractor: boolean
  clearImpersonation: () => void
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined)

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [impersonatedContractor, setImpersonatedContractor] = useState<ImpersonatedContractor | null>(null)

  const clearImpersonation = useCallback(() => {
    setImpersonatedContractor(null)
  }, [])

  const value: ImpersonationContextType = {
    impersonatedContractor,
    setImpersonatedContractor,
    isImpersonatingContractor: impersonatedContractor !== null,
    clearImpersonation,
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
