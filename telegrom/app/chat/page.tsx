'use client'

import ChatList from '@/ChatList' // La lista de chat
import Chat from '@/chat/index'     // El chat principal
import { ChatProvider } from '../context/ChatContext'
import { Box, useMediaQuery } from '@mui/material'

export default function ChatPage() {
  const isMobile = useMediaQuery('(max-width:600px)')

  return (
    <ChatProvider>
      <Box display="flex" height="100vh">
        {!isMobile && (
          <Box width="30%">
            <ChatList />
          </Box>
        )}
        <Box flex={1}>
          <Chat />
        </Box>
      </Box>
    </ChatProvider>
  )
}
