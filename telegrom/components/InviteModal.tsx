'use client';
import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { useGlobal } from '@/context/GlobalContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/libs/apiClient';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteModal({ open, onClose }: InviteModalProps) {
  const router = useRouter();
  const { state, dispatch } = useGlobal();

  const [inviteLink, setInviteLink] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [snack, setSnack] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Limpiar estado al abrir/cerrar
  useEffect(() => {
    if (open) {
        setInviteLink('');
        setTokenInput('');
    }
  }, [open]);

  // 🔹 Generar enlace (Personal o de Grupo)
  const handleGenerate = async () => {
    setLoading(true);
    setSnack(null);

    try {
      // Lógica Inteligente:
      // Si hay activeChatId -> Invitación a ese Chat (Grupo)
      // Si NO hay activeChatId -> Invitación Personal (Crea chat nuevo al aceptarse)
      const bodyPayload = state.activeChatId ? { chatId: state.activeChatId } : {};

      const res = await apiFetch('/invite', { 
          method: 'POST',
          body: JSON.stringify(bodyPayload)
      });

      if (!res?.link && !res?.body?.link) throw new Error('Error al generar el enlace');

      const link = res.link || res.body.link;
      setInviteLink(link);
      
      const typeMsg = state.activeChatId ? 'para este chat' : 'personal';
      setSnack({ msg: `✅ Enlace ${typeMsg} generado correctamente`, type: 'success' });

    } catch (err: any) {
      console.error('❌ Error al generar invitación:', err);
      setSnack({ msg: err.message || 'Error al generar el enlace', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Copiar al portapapeles
  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setSnack({ msg: '📋 Copiado al portapapeles', type: 'success' });
  };

  // 🔹 Unirse mediante token/link
  const handleJoin = async () => {
    if (!tokenInput.trim()) return;
    setLoading(true);

    try {
      // Extraer token si el usuario pegó la URL completa
      let tokenToSend = tokenInput.trim();
      if (tokenToSend.includes('/invite/')) {
          tokenToSend = tokenToSend.split('/invite/').pop() || tokenToSend;
      }

      const res = await apiFetch('/invite/accept', {
        method: 'POST',
        body: JSON.stringify({
          token: tokenToSend,
          guestName: state.user?.name || 'Invitado',
        }),
      });

      // El backend devuelve el chat y el usuario actualizado
      const roomId = res.chat?.id || res.roomId || res.body?.chat?.id;

      if (!roomId) throw new Error('Invitación procesada pero sin ID de sala');

      // 1. Agregamos el chat al estado global si viene completo
      if (res.chat || res.body?.chat) {
          dispatch({ type: 'ADD_CHAT', payload: res.chat || res.body.chat });
      }

      // 2. Activamos el chat
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: roomId });

      setSnack({ msg: '✅ ¡Te has unido al chat!', type: 'success' });
      onClose();
      router.push(`/chat/${roomId}`);

    } catch (err: any) {
      console.error('❌ Error al unirse:', err);
      setSnack({ msg: err.message || 'Invitación inválida o expirada', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isPersonalMode = !state.activeChatId;

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 420,
            bgcolor: '#202c33', // Color estilo WhatsApp Dark
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            color: '#e9edef',
            outline: 'none'
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isPersonalMode ? <PersonAddIcon color="primary" /> : <GroupAddIcon color="secondary" />}
              {isPersonalMode ? 'Invitar a conectar' : 'Invitar al grupo'}
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: '#8696a0' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" color="#8696a0" sx={{ mb: 3 }}>
            {isPersonalMode 
                ? "Genera un enlace único. Quien lo use abrirá un chat directo contigo."
                : "Cualquiera con este enlace podrá unirse a esta conversación actual."
            }
          </Typography>

          {/* Sección Generar */}
          <Box>
            {!inviteLink ? (
                <Button
                variant="contained"
                fullWidth
                onClick={handleGenerate}
                disabled={loading}
                startIcon={<LinkIcon />}
                sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    backgroundColor: '#00a884',
                    '&:hover': { backgroundColor: '#029271' },
                }}
                >
                {loading ? 'Generando...' : isPersonalMode ? 'Crear mi enlace personal' : 'Crear enlace de grupo'}
                </Button>
            ) : (
                <Box 
                    sx={{ 
                        bgcolor: '#111b21', 
                        p: 2, 
                        borderRadius: 2, 
                        border: '1px solid #00a884',
                        position: 'relative'
                    }}
                >
                    <Typography variant="caption" color="#00a884" fontWeight="bold" sx={{ mb: 1, display: 'block' }}>
                        ¡Enlace listo! Compártelo:
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ wordBreak: 'break-all', color: '#e9edef', mb: 2, fontFamily: 'monospace' }}
                    >
                        {inviteLink}
                    </Typography>
                    
                    <Button 
                        size="small" 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopy}
                        sx={{ 
                            color: '#00a884', 
                            borderColor: '#00a884',
                            '&:hover': { borderColor: '#029271', bgcolor: 'rgba(0,168,132,0.1)' }
                        }}
                    >
                        Copiar Enlace
                    </Button>
                </Box>
            )}
          </Box>

          {/* Separador */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#2a3942' }} />
            <Typography variant="caption" sx={{ px: 2, color: '#8696a0' }}>O</Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#2a3942' }} />
          </Box>

          {/* Sección Unirse */}
          <Box>
            <Typography variant="subtitle2" color="#e9edef" gutterBottom>
              ¿Tienes un código o enlace?
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                variant="outlined"
                fullWidth
                size="small"
                placeholder="Pega el link aquí..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                sx={{
                    input: { color: '#e9edef' },
                    backgroundColor: '#111b21',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3942' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#8696a0' },
                }}
                />
                <Button
                variant="contained"
                onClick={handleJoin}
                disabled={loading || !tokenInput.trim()}
                sx={{
                    bgcolor: '#2a3942',
                    minWidth: '80px',
                    '&:hover': { bgcolor: '#374248' }
                }}
                >
                Unirse
                </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Notificaciones */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack && (
          <Alert severity={snack.type} onClose={() => setSnack(null)} variant="filled">
            {snack.msg}
          </Alert>
        )}
      </Snackbar>
    </>
  );
}