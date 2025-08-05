// /app/page.tsx
'use client'

import ChatList from './components/ChatList/Render'
import Chat from './components/chat/Render'
import { ChatProvider } from './context/ChatContext'
import { Box, useMediaQuery } from '@mui/material'

export default function HomePage() {
  const isMobile = useMediaQuery('(max-width:600px)')

  return (
    <ChatProvider>
      <Box display="flex" height="100vh">
        {!isMobile && <Box width="30%"><ChatList /></Box>}
        <Box flex={1}>
          {isMobile ? <Chat /> : <Chat />}
        </Box>
      </Box>
    </ChatProvider>
  )
}
