'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './utils/UserContext';

// Fases principales del ciclo de vida de la app
export type AppPhase = 
  | 'initial'      // app arrancando, aún no se sabe si hay sesión
  | 'auth'         // usuario en login o registro
  | 'loading'      // validando sesión / esperando cookies
  | 'skeleton'     // precargando chat (estructura vacía)
  | 'chat'         // sesión activa, chat cargado
  | 'error';       // error general

type AppPhaseContextType = {
  phase: AppPhase;
  setPhase: (p: AppPhase) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  goToPhase: (p: AppPhase) => void;
};

const AppPhaseContext = createContext<AppPhaseContextType | undefined>(undefined);

export function AppPhaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<AppPhase>('initial');
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: userLoading } = useUser();

  // Transiciones automáticas basadas en estado de usuario
  useEffect(() => {
    if (userLoading) {
      setPhase('loading');
      setIsLoading(true);
      return;
    }

    if (!user) {
      setPhase('auth');
      setIsLoading(false);
      return;
    }

    // Usuario presente: entrar al flujo del chat
    setPhase('skeleton');
    setIsLoading(true);

    // Simulamos precarga visual
    const timer = setTimeout(() => {
      setPhase('chat');
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, userLoading]);

  const goToPhase = useCallback((p: AppPhase) => {
    setPhase(p);
    setIsLoading(p === 'loading');
  }, []);

  return (
    <AppPhaseContext.Provider value={{ phase, setPhase, isLoading, setIsLoading, goToPhase }}>
      {children}
    </AppPhaseContext.Provider>
  );
}

export function useAppPhase() {
  const ctx = useContext(AppPhaseContext);
  if (!ctx) throw new Error('useAppPhase debe usarse dentro de AppPhaseProvider');
  return ctx;
}
