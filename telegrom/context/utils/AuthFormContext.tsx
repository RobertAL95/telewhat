'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';

type LoginData = { email: string; password: string };
type RegisterData = { name: string; email: string; password: string };
type AuthMode = 'login' | 'register';

type AuthFormContextType = {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  loginData: LoginData;
  registerData: RegisterData;
  updateLoginData: (data: Partial<LoginData>) => void;
  updateRegisterData: (data: Partial<RegisterData>) => void;
};

const AuthFormContext = createContext<AuthFormContextType | undefined>(undefined);

export function AuthFormProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterData>({ name: '', email: '', password: '' });

  const updateLoginData = useCallback((data: Partial<LoginData>) => {
    setLoginData(prev => ({ ...prev, ...data }));
  }, []);

  const updateRegisterData = useCallback((data: Partial<RegisterData>) => {
    setRegisterData(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <AuthFormContext.Provider value={{ authMode, setAuthMode, loginData, registerData, updateLoginData, updateRegisterData }}>
      {children}
    </AuthFormContext.Provider>
  );
}

export function useAuthForm() {
  const ctx = useContext(AuthFormContext);
  if (!ctx) throw new Error('useAuthForm debe usarse dentro de AuthFormProvider');
  return ctx;
}
