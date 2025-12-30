'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Paper, 
  TextField, 
  Alert 
} from '@mui/material';
import { useGlobal } from '@/context/GlobalContext';
import { apiFetch } from '@/libs/apiClient';

export default function InvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { dispatch } = useGlobal();

  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [joining, setJoining] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');

  // Decodificar token de la URL
  const decodedToken = token ? decodeURIComponent(token) : '';

  // 1. Validar el token al montar
  useEffect(() => {
    if (!decodedToken) return;

    const validate = async () => {
      try {
        const res = await apiFetch(`/invite/validate/${encodeURIComponent(decodedToken)}`);
        // Aceptamos true directo o un objeto { valid: true }
        if (res === true || res.valid || res === 'true') {
          setIsValid(true);
        } else {
          setError('El enlace de invitación ha expirado o no es válido.');
        }
      } catch (err) {
        console.error(err);
        setError('Error al validar la invitación.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [decodedToken]);

  // 2. Aceptar invitación (Lógica corregida)
// 2. Aceptar invitación (CORREGIDO PARA SINCRONIZACIÓN GLOBAL)
  const handleJoin = async () => {
    if (!guestName.trim()) {
      setError('Por favor, ingresa un nombre para unirte.');
      return;
    }
    
    setJoining(true);
    setError('');

    try {
        const res = await apiFetch('/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ 
          token: decodedToken, 
          guestName: guestName.trim() 
        }),
      });

      // --- LÓGICA CORREGIDA ---
      const data = res.body || res;
      
      // Datos del usuario (Guest)
      const userData = data.user;
      
      // Datos del Chat (Que ahora vienen bonitos del backend)
      const chatData = data.chat; 

      if (!chatData || !userData) {
        throw new Error('Datos incompletos del servidor.');
      }

      // 1. Actualizar Usuario Global
      dispatch({
        type: 'SET_USER',
        payload: {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          isGuest: true,
        },
      });

      // 2. 🔥 VINCULACIÓN VISUAL EXACTA
      // Usamos los datos reales del backend. 
      // El Guest verá el nombre del Host, no "Nuevo Grupo".
      dispatch({
        type: 'ADD_CHAT',
        payload: {
            id: chatData.id,
            name: chatData.name, // "Juan Perez" (Nombre del Host)
            lastMessage: chatData.lastMessage,
            timestamp: chatData.timestamp,
            avatar: chatData.avatar
        }
      });

      // 3. Activar y Redirigir
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatData.id });
      router.push(`/chat/${chatData.id}`);
    } catch (err: any) {
      console.error('❌ Error aceptando invitación:', err);
      setError(err.message || 'No se pudo unir al chat.');
    } finally {
        setJoining(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: '#111b21' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100vh', 
        justifyContent: 'center', 
        alignItems: 'center', 
        bgcolor: '#111b21',
        p: 2 
      }}
    >
      <Paper 
        elevation={4}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          bgcolor: '#202c33',
          color: '#e9edef',
          borderRadius: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#00a884' }}>
          Invitación a Flym
        </Typography>

        {!isValid ? (
          <Alert severity="error" sx={{ mt: 2, bgcolor: '#3b4252', color: '#fff' }}>
            {error || 'Invitación no válida.'}
          </Alert>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 3, color: '#8696a0' }}>
              Te han invitado a un chat seguro. Elige un nombre para unirte.
            </Typography>

            <TextField 
              fullWidth
              placeholder="Tu nombre (ej. Alex)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              variant="outlined"
              autoFocus
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#2a3942',
                  borderRadius: 2,
                  color: '#fff',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: '#00a884' },
                  '&.Mui-focused fieldset': { borderColor: '#00a884' }
                }
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleJoin}
              disabled={joining}
              sx={{
                bgcolor: '#00a884',
                color: '#fff',
                fontWeight: 'bold',
                textTransform: 'none',
                py: 1.5,
                borderRadius: 2,
                '&:hover': { bgcolor: '#008f6f' }
              }}
            >
              {joining ? <CircularProgress size={24} color="inherit" /> : 'Unirse al Chat'}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}