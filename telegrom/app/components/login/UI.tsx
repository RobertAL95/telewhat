// /components/Chat/UI.tsx
import { Box, Typography, TextField, IconButton, List, ListItem } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { useState } from 'react'
import { Message } from '../../context/ChatContext'

type Props = {
  messages: Message[]
  onSend: (text: string) => void
}

export const ChatUI = ({ messages, onSend }: Props) => {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (text.trim()) {
      onSend(text)
      setText('')
    }
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box flexGrow={1} overflow="auto" p={1}>
        <List>
          {messages.map(msg => (
            <ListItem
              key={msg.id}
              style={{
                justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                bgcolor={msg.sender === 'me' ? 'primary.main' : 'grey.300'}
                color={msg.sender === 'me' ? 'white' : 'black'}
                borderRadius={2}
                px={2}
                py={1}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box display="flex" p={1} borderTop="1px solid #ccc">
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Escribe un mensaje"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <IconButton color="primary" onClick={handleSend}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  )
}
