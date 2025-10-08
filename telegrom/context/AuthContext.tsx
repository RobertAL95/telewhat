'use client';

import { ReactNode } from 'react';
import { UserProvider } from './utils/UserContext';
import { AuthFormProvider } from './utils/AuthFormContext';
import { useAuthService } from './utils/useAuthService';
import { useUser } from './utils/UserContext';
import { useAuthForm } from './utils/AuthFormContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <AuthFormProvider>{children}</AuthFormProvider>
    </UserProvider>
  );
}

export function useAuth() {
  const userCtx = useUser();
  const formCtx = useAuthForm();
  const serviceCtx = useAuthService();

  return { ...userCtx, ...formCtx, ...serviceCtx };
}
