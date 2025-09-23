'use client'

import { ChatUI } from './UI'
import { useChat } from './Logica'
import { Box, Typography, Button, Dialog, DialogContent, DialogActions } from '@mui/material'

export default function Chat() {
  const { chat, newMessage, setNewMessage, onSend } = useChat()

  if (!chat) {
    return (
      <Dialog open={!chat}>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" mb={2}>
            Comparte este link para iniciar el chat con alguien
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Copiar link
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <ChatUI
      chat={chat}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSend={onSend}
    />
  )
}
