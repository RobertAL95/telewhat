'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/context/GlobalContext';
import { Box, CircularProgress } from '@mui/material';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state } = useGlobal();
  const router = useRouter();
  const { user, loading } = state;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null; // No renderizar nada mientras redirige
  }

  return <>{children}</>;
}