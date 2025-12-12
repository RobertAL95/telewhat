'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { orchestrator } from '@/Phases/Phases';
import { apiFetch } from '@/libs/apiClient';
import type { UserProfile } from './types';
import ProfileView from './profileView';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookies = orchestrator.getCookies();
    if (!cookies) return; // ⏳ espera hidratación de cookies

    (async () => {
      try {
        const data = await apiFetch('/auth/me'); // fetch con cookies incluidas
        setProfile(data);
      } catch (err) {
        console.warn('[Flym] Sesión no válida o expirada → redirigiendo a Auth');
        orchestrator.clearCookies();
        orchestrator.goToPhase('Auth');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );

  if (!profile)
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography>No se pudo cargar el perfil.</Typography>
      </Box>
    );

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        px: 2,
      }}
    >
      <ProfileView user={profile} />
    </Box>
  );
}

