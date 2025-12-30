'use client';
import { useEffect } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/context/GlobalContext'; // ✅ Importamos el Estado Global

export default function Home() {
  const router = useRouter();
  const { state } = useGlobal(); 
  const { user, loading } = state;

  useEffect(() => {
    // 🛡️ LÓGICA DE BLINDAJE:
    // Si ya dejó de cargar y el usuario existe, nos vamos directo al chat.
    if (!loading && user) {
      router.replace('/chat'); // Usamos 'replace' para no dejar historial del Home
    }
  }, [user, loading, router]);

  // 🔄 Mientras verificamos la sesión, mostramos un Spinner elegante
  if (loading) {
    return (
      <Box 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          bgcolor: 'background.default' 
        }}
      >
        <CircularProgress color="primary" size={60} thickness={4} />
        <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '0.9rem' }}>
           Verificando sesión...
        </Typography>
      </Box>
    );
  }

  // Si NO hay usuario y NO está cargando, mostramos la Landing Page normal
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