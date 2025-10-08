'use client';

import React, { useEffect, useState, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useUser } from '../../context/utils/UserContext';

interface WithAuthOptions {
  allowGuest?: boolean; // si true, permite ver contenido parcialmente a usuarios no autenticados
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: WithAuthOptions
) {
  const { allowGuest = false } = options || {};

  const AuthWrapper = forwardRef<unknown, P>((props, ref) => {
    const { user, loading } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Evitar render hasta que se monte el componente (Next.js client-side)
    useEffect(() => setMounted(true), []);

    // Redirigir si no hay user y no se permiten invitados
    useEffect(() => {
      if (!loading && mounted && !user?.id && !allowGuest) {
        router.replace('/chat');
      }
    }, [user, loading, mounted, router, allowGuest]);

    // Mostrar loader mientras se monta o valida usuario
    if (!mounted || loading || (!user?.id && !allowGuest)) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    // Renderizar componente protegido o parcialmente visible si es invitado
    return <WrappedComponent ref={ref} {...props} />;
  });

  AuthWrapper.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  // Cast seguro para TypeScript, evitando errores con forwardRef
  return AuthWrapper as unknown as React.FC<P>;
}
