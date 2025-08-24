// /components/Chat/Render.tsx
'use client'

import { useChatLogic } from './Logica'
import { ChatUI } from './UI'
import { Typography, Box } from '@mui/material'

const Chat = () => {
  const { currentChat, sendMessage } = useChatLogic()

  if (!currentChat)
    return (
      <Box p={2}>
        <Typography variant="h6">Selecciona un chat para comenzar</Typography>
      </Box>
    )

  return <ChatUI messages={currentChat.messages} onSend={sendMessage} />
}

export default Chat
