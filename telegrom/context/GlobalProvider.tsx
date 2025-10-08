'use client';

import React, { ReactNode } from 'react';
import { AppPhaseProvider } from './AppPhaseContext';
import { UserProvider } from './utils/UserContext';
import { AuthFormProvider } from './utils/AuthFormContext';
import { AuthProvider } from './AuthContext';

/**
 * GlobalProvider centraliza TODO el estado global de la aplicación.
 * Incluye:
 *  - Estado de usuario (UserProvider)
 *  - Estado de formularios de login/registro (AuthFormProvider)
 *  - Servicios de autenticación (AuthProvider)
 *  - Máquina de fases de aplicación (AppPhaseProvider)
 */
export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AppPhaseProvider>
      <UserProvider>
        <AuthFormProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AuthFormProvider>
      </UserProvider>
    </AppPhaseProvider>
  );
};
