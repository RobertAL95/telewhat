'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type AuthCardState = 'login' | 'register'

interface AuthCardContextType {
  state: AuthCardState
  setState: (s: AuthCardState) => void
}

const AuthCardContext = createContext<AuthCardContextType | undefined>(undefined)

export const AuthCardProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthCardState>('login')

  return (
    <AuthCardContext.Provider value={{ state, setState }}>
      {children}
    </AuthCardContext.Provider>
  )
}

export const useAuthCard = () => {
  const ctx = useContext(AuthCardContext)
  if (!ctx) throw new Error('useAuthCard debe usarse dentro de AuthCardProvider')
  return ctx
}
