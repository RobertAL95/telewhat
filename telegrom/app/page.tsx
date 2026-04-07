'use client';
import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // 🛡️ Importamos al Guardia

export default function Home() {
  const router = useRouter();
  const { user } = useAuth(); // Solo pedimos el usuario

  useEffect(() => {
    // 🛡️ Si el usuario existe, nos vamos directo al chat.
    if (user) {
      router.replace('/chat');
    }
  }, [user, router]);

  // Si hay usuario, retornamos null mientras hace el redirect para que no se vea la Landing Page
  if (user) return null;

  // Landing Page normal (Solo se muestra si NO hay usuario)
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Bienvenido a <span style={{ color: '#00a884' }}>Flym</span>
      </Typography>
      <Typography sx={{ mb: 3, color: 'text.secondary' }}>
        Una app de mensajería efímera y segura
      </Typography>
      <Button variant="contained" color="primary" onClick={() => router.push('/Auth')}>
        Comenzar
      </Button>
    </Box>
  );
}