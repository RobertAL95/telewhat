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

      console.log('📡 Respuesta del Backend:', res); // Muestra qué llegó exactamente

      // --- INICIO DE LÓGICA DEFENSIVA ---
      // Normalizamos la respuesta: a veces viene dentro de 'body', a veces directo
      const data = res.body || res;

      // 1. Buscar Room ID (puede venir como roomId o chatId)
      const roomId = data.roomId || data.chatId;
      if (!roomId) {
        throw new Error('El servidor no devolvió un ID de sala válido.');
      }

      // 2. Buscar datos del Usuario (puede venir como user, guest o data)
      const userData = data.user || data.guest || data;
      
      // 3. Obtener el ID del usuario (_id o id)
      const userId = userData?._id || userData?.id;

      if (!userId) {
        throw new Error('El servidor no devolvió los datos del usuario invitado.');
      }
      // --- FIN DE LÓGICA DEFENSIVA ---

      // Actualizar contexto global
      dispatch({
        type: 'SET_USER',
        payload: {
          id: userId,
          name: userData.name || guestName,
          email: userData.email || 'guest@flym.com',
          avatar: userData.avatar,
          isGuest: true,
        },
      });

      // Establecer chat activo
      dispatch({ type: 'SET_CHAT', payload: roomId });

      // Redirigir
      console.log('✅ Todo correcto. Redirigiendo al chat:', roomId);
      router.push('/chat'); 

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