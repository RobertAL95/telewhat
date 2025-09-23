'use client'

import { useChatContext } from '../context/ChatContext'
import { Dialog, DialogContent, Typography, TextField, Button, Box } from '@mui/material'
import ChatList from '../../components/ChatList'
import ChatComponent from '../../components/chat'

export default function ChatPage() {
  const {
    isGuest,
    isLoading,
    participantName,
    updateParticipantName,
    registerParticipant,
    chats,
    selectedChatId,
    selectChat,
    sendMessage,
  } = useChatContext()

  // Esperar a que se cargue la info del usuario
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <Typography variant="h6">Cargando...</Typography>
      </Box>
    )
  }

  // Modal para invitados sin nombre
  if (isGuest && !participantName) {
    return (
      <Dialog open fullScreen>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" mb={2}>
            Ingresa tu nombre para entrar al chat
          </Typography>
          <TextField
            fullWidth
            placeholder="Tu nombre"
            value={participantName ?? ''}
            onChange={(e) => updateParticipantName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            fullWidth
            onClick={() => participantName?.trim() && registerParticipant(participantName)}
          >
            Entrar al chat
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  // Layout principal del chat
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ width: '300px', borderRight: '1px solid #ccc' }}>
        <ChatList chats={chats} selectedChatId={selectedChatId} selectChat={selectChat} />
      </Box>
      <Box sx={{ flex: 1 }}>
        {selectedChatId && chats.find(c => c.id === selectedChatId) ? (
          <ChatComponent
            chat={chats.find((c) => c.id === selectedChatId)!} // ya sabemos que existe
            sendMessage={(text) => sendMessage(selectedChatId, text)}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="h6">Selecciona un chat para comenzar</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
