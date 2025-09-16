'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  name: string
  email?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

interface AuthContextType {
  authState: AuthState
  setAuthState: (state: AuthState) => void
  isRegister: boolean
  setIsRegister: (val: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  })

  const [isRegister, setIsRegister] = useState(false)

  return (
    <AuthContext.Provider value={{ authState, setAuthState, isRegister, setIsRegister }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe estar dentro de AuthProvider')
  return context
}
