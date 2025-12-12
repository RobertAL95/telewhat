'use client';
import { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useGlobal } from '@/context/GlobalContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/libs/apiClient';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal para crear o aceptar invitaciones de chat
 * - Genera link con /invite (JWT + chatId)
 * - Acepta token con /invite/accept
 */
export default function InviteModal({ open, onClose }: InviteModalProps) {
  const router = useRouter();
  const { state, dispatch } = useGlobal();

  const [inviteLink, setInviteLink] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [snack, setSnack] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Generar enlace de invitación
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/invite', { method: 'POST' }); // ✅ cookies viajan solas
      if (!res?.link && !res?.body?.link) throw new Error('Error al generar el enlace');

      const link = res.link || res.body.link;
      setInviteLink(link);
      setSnack({ msg: '✅ Enlace generado correctamente', type: 'success' });
    } catch (err: any) {
      console.error('❌ Error al generar invitación:', err);
      setSnack({ msg: err.message || 'Error al generar el enlace', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Unirse mediante token
const handleJoin = async () => {
  if (!tokenInput.trim()) return;
  setLoading(true);

  try {
    const res = await apiFetch('/invite/accept', {
      method: 'POST',
      body: JSON.stringify({
        token: tokenInput.trim(),
        guestName: state.user?.name || 'Invitado',
      }),
    });

    if (!res?.roomId) throw new Error('Invitación inválida o expirada');

    dispatch({ type: 'SET_CHAT', payload: res.roomId });

    setSnack({ msg: 'Unido al chat con éxito', type: 'success' });

    router.push(`/chat/${res.roomId}`);

  } catch (err: any) {
    console.error('❌ Error al unirse:', err);
    setSnack({ msg: err.message || 'Invitación inválida o expirada', type: 'error' });
  } finally {
    setLoading(false);
  }
};


  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 420,
            bgcolor: '#202c33',
            borderRadius: 3,
            boxShadow: 24,
            p: 3,
            color: '#e9edef',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Invitar o unirse a un chat
            </Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: '#8696a0' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Generar enlace */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="#8696a0" gutterBottom>
              Generar enlace de invitación
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleGenerate}
              disabled={loading}
              sx={{
                textTransform: 'none',
                backgroundColor: '#00a884',
                '&:hover': { backgroundColor: '#029271' },
              }}
            >
              {loading ? 'Generando...' : 'Crear enlace'}
            </Button>

            {inviteLink && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: '#111b21',
                  borderRadius: 2,
                  wordBreak: 'break-all',
                  border: '1px solid #2a3942',
                }}
              >
                <Typography variant="body2" color="#e9edef">
                  {inviteLink}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Unirse mediante token */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" color="#8696a0" gutterBottom>
              Unirse a un chat con token
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              placeholder="Pega el token aquí..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              sx={{
                input: { color: '#e9edef' },
                backgroundColor: '#111b21',
                borderRadius: 2,
                mb: 2,
              }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleJoin}
              disabled={loading}
              sx={{
                textTransform: 'none',
                backgroundColor: '#00a884',
                '&:hover': { backgroundColor: '#029271' },
              }}
            >
              {loading ? 'Uniéndose...' : 'Unirse al chat'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack && (
          <Alert severity={snack.type} sx={{ bgcolor: '#111b21', color: '#e9edef' }}>
            {snack.msg}
          </Alert>
        )}
      </Snackbar>
    </>
  );
}
