'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useChatContext } from '../context/ChatContext'
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

export default function ChatGate() {
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
    setToken,
  } = useChatContext()

  useEffect(() => {
    const room = searchParams.get('room')
    const token = searchParams.get('token')

    if (!room || !token) {
      // Usuario es creador → pedimos al backend crear sala
      const authToken = localStorage.getItem('authToken') // el token de login del usuario
      if (!authToken) return

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setRoomId(data.roomId)
          setCreator(true)
          setToken(data.token)
          router.replace(`/chat?room=${data.roomId}&token=${data.token}`)
        })
        .catch((err) => console.error('Error creando sala', err))
    } else {
      // Usuario es invitado
      setRoomId(room)
      setCreator(false)
      setToken(token)
    }
  }, [searchParams, router, setRoomId, setCreator, setToken])

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
    const link =
      typeof window !== 'undefined' ? window.location.href : ''
    return (
      <Dialog open fullScreen>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h6" mb={2}>
            Comparte este link para que alguien se una al chat
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigator.clipboard.writeText(link)}
          >
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
