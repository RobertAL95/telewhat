'use client'

import ChatList from '@/components/ChatList/Render' // La lista de chat
import Chat from '@/components/chat/Render'     // El chat principal
import { ChatProvider } from '@/context/ChatContext'
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
