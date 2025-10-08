'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Modal, Typography, TextField, Button } from '@mui/material';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useUser } from '../../context/utils/UserContext';

export default function ChatComponent() {
  const { loginGuest } = useUser();

  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
  const [guestName, setGuestName] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('invite');
    if (token) {
      setInviteToken(token);
      setShowModal(true);
    }
  }, []);

  const handleEnterChat = async () => {
    if (!guestName.trim() || !inviteToken) return;
    setLoadingGuest(true);
    setError(null);

    try {
      const chatId = await loginGuest(inviteToken, guestName);
      if (!chatId) {
        setError('No se pudo entrar al chat. Verifica el enlace.');
        return;
      }

      setSelectedChatId(chatId);
      setShowModal(false);
    } catch (err) {
      console.error('❌ Error loginGuest invitado:', err);
      setError('Error desconocido al entrar al chat');
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      <Paper sx={{ flex: '0 0 25%', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <ChatList onSelectChat={(id: string) => setSelectedChatId(id)} />
      </Paper>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatWindow selectedChatId={selectedChatId} guestName={guestName} />
      </Box>

      <Modal open={showModal}>
        <Box
          sx={{
            p: 4,
            bgcolor: 'white',
            mx: 'auto',
            mt: '20%',
            width: 300,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6">Ingresa tu nombre</Typography>
          <TextField
            placeholder="Tu nombre"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            fullWidth
            disabled={loadingGuest}
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button
            variant="contained"
            fullWidth
            disabled={!guestName.trim() || loadingGuest}
            onClick={handleEnterChat}
          >
            {loadingGuest ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
