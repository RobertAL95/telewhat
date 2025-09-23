'use client'
import { Box, Typography, TextField, Button } from '@mui/material'
import { Chat as ChatType } from '../../app/data/chatData' // IMPORTAR desde chatData

interface ChatUIProps {
  chat: ChatType
  newMessage: string
  setNewMessage: (msg: string) => void
  onSend: () => void
}

export function ChatUI({ chat, newMessage, setNewMessage, onSend }: ChatUIProps) {
  return (
    <Box display="flex" flexDirection="column" height="100vh" p={2}>
      <Typography variant="h4" mb={2}>
        Chat con {chat.name}
      </Typography>

      <Box flex={1} overflow="auto" mb={2}>
        {chat.messages.map(m => (
          <Box key={m.id} mb={1} textAlign={m.sender === 'me' ? 'right' : 'left'}>
            <Typography
              component="span"
              sx={{
                backgroundColor: m.sender === 'me' ? '#2196f3' : '#e0e0e0',
                color: m.sender === 'me' ? 'white' : 'black',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              {m.text}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Escribe un mensaje"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
        />
        <Button variant="contained" onClick={onSend}>
          Enviar
        </Button>
      </Box>
    </Box>
  )
}
