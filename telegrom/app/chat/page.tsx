'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChatProvider, useChatContext } from '../context/ChatContext'
import ChatList from '../../components/ChatList'
import Chat from '../../components/chat'
import {
  Box,
  useMediaQuery,
  Dialog,
  DialogContent,
  Typography,
  Button,
  TextField,
} from '@mui/material'

function ChatGate() {
  const isMobile = useMediaQuery('(max-width:600px)')
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    isRegistered,
    participantName,
    updateParticipantName,
    registerParticipant,
    creator,
    setCreator,
    roomId,
    setRoomId,
  } = useChatContext()

  useEffect(() => {
    const room = searchParams.get('room')
    if (!room) {
      // Usuario es creador
      const newRoom = crypto.randomUUID()
      setRoomId(newRoom)
      setCreator(true)
      router.replace(`/chat?room=${newRoom}`)
    } else {
      // Usuario es invitado
      setRoomId(room)
      setCreator(false)
    }
  }, [searchParams, router, setRoomId, setCreator])

  if (!isRegistered && !creator) {
    // Invitado debe ingresar nombre
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
            onClick={() =>
              participantName?.trim() && registerParticipant(participantName)
            }
          >
            Entrar al chat
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  if (creator && !isRegistered) {
    // Creador solo ve link
    const link = typeof window !== 'undefined' ? window.location.href : ''
    return (
      <Dialog open fullScreen>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" mb={2}>
            Comparte este link para que alguien se una al chat
          </Typography>
          <Button variant="contained" onClick={() => navigator.clipboard.writeText(link)}>
            Copiar link
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  // Chat listo para usarse
  return (
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
  )
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatGate />
    </ChatProvider>
  )
}
