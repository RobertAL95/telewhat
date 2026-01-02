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
  Alert,
  Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { useGlobal } from '@/context/GlobalContext';
import { apiFetch } from '@/libs/apiClient';

export default function InvitePage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { dispatch } = useGlobal();

  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<any>(null); // Guardamos info del invitador
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
        console.log('🔍 Validando token:', decodedToken);
        const res = await apiFetch(`/invite/validate/${encodeURIComponent(decodedToken)}`);
        
        console.log('✅ Respuesta validación:', res);

        // Aceptamos varias estructuras posibles para robustez
        const data = res.body || res;

        if (data === true || data.valid === true) {
          setIsValid(true);
          setInviteInfo(data); // Guardamos nombre del invitador/grupo
        } else {
          console.warn('❌ Token inválido según backend:', data);
          setError('El enlace de invitación ha expirado o no es válido.');
        }
      } catch (err) {
        console.error('❌ Error API validar:', err);
        setError('Error al validar la invitación.');
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [decodedToken]);

  // 2. Aceptar invitación
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

      const data = res.body || res;
      const userData = data.user;
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

      // 2. Agregar el chat
      dispatch({
        type: 'ADD_CHAT',
        payload: {
            id: chatData.id,
            name: chatData.name, 
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
          Flym Invitación
        </Typography>

        {!isValid ? (
          <Alert severity="error" sx={{ mt: 2, bgcolor: '#3b4252', color: '#fff' }}>
            {error || 'El enlace de invitación ha expirado o no es válido.'}
          </Alert>
        ) : (
          <>
            <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                    src={inviteInfo?.inviterAvatar} 
                    sx={{ width: 64, height: 64, mb: 2, bgcolor: '#00a884' }}
                >
                    <PersonIcon fontSize="large" />
                </Avatar>
                
                <Typography variant="h6">
                  {inviteInfo?.inviterName || 'Alguien'} te invita a chatear
                </Typography>
                
                {inviteInfo?.chatName && inviteInfo?.chatName !== 'Chat Directo' && (
                    <Typography variant="body2" color="#8696a0" sx={{ mt: 0.5 }}>
                        Grupo: {inviteInfo.chatName}
                    </Typography>
                )}
            </Box>

            <Typography variant="body2" sx={{ mb: 3, color: '#8696a0' }}>
              Elige un nombre para unirte a la conversación.
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
              <Alert severity="error" sx={{ mb: 2, textAlign: 'left', bgcolor: 'rgba(239, 83, 80, 0.1)', color: '#ef5350' }}>
                {error}
              </Alert>
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