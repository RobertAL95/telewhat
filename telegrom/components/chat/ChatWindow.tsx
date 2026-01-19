'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  Typography,
  Avatar,
  CircularProgress, // 👈 Importado para el loading
  Paper
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useGlobal } from '@/context/GlobalContext';
import { sendMessage } from '@/libs/wsClient'; 
import { useChatWS } from '@/hooks/useChatWS';

interface ChatWindowProps {
    roomId?: string; 
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const { state, dispatch } = useGlobal();
  
  // Determinamos el ID activo
  const activeId = roomId || state.activeChatId;
  
  // Buscamos los metadatos del chat (Nombre, Avatar, etc.)
  // Esto es necesario para los guardianes de sincronización
  const currentChat = state.chats.find((c: any) => (c.id === activeId) || (c._id === activeId));

  const messages = activeId ? state.messages[activeId] || [] : [];
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook de WebSocket (Mantiene la conexión viva)
  useChatWS();

  // Scroll al fondo
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

// src/components/Chat/ChatWindow.tsx

  const handleSend = () => {
    if (!activeId || !input.trim()) return;
    
    // 1. Enviar por WS (Esto viaja al servidor y vuelve como un boomerang)
    sendMessage(input.trim()); 

    // 2. ❌ ELIMINAR O COMENTAR ESTO (Causante del duplicado)
    /* dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        chatId: activeId,
        msg: {
          from: state.user?.id,
          text: input.trim(),
          timestamp: Date.now(),
          isSelf: true 
        }
      }
    });
    */

    // Solo limpiamos el input
    setInput('');
  };
  // =====================================================================
  // 🛡️ GUARDIANES DE ESTADO (State Guards)
  // =====================================================================

  // GUARDIA 1: Identidad (Evita crash por user null)
  if (!state.user) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
        <Typography sx={{ ml: 2, color: '#8696a0' }}>Cargando identidad...</Typography>
      </Box>
    );
  }

  // GUARDIA 2: Sincronización (Tenemos ID en URL, pero el chat no está en la lista aún)
  if (activeId && !currentChat) {
     return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a', flexDirection: 'column' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
        <Typography sx={{ mt: 2, color: '#8696a0' }}>Sincronizando chat...</Typography>
      </Box>
    );
  }

  // GUARDIA 3: Estado Neutro / Lobby (No hay ID seleccionado)
  if (!activeId) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#222e35', borderBottom: '6px solid #00a884' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h4" color="#e9edef" fontWeight="light">Flym Web</Typography>
            <Typography variant="body1" color="#8696a0" sx={{ mt: 2 }}>
                Selecciona un chat para comenzar a enviar mensajes.
            </Typography>
        </Box>
      </Box>
    );
  }

  // =====================================================================
  // 🎨 RENDERIZADO PRINCIPAL (Solo si pasamos los guardianes)
  // =====================================================================

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0b141a' }}>
      {/* Header del Chat */}
      <Box
        sx={{
          height: 60,
          bgcolor: '#202c33',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          borderBottom: '1px solid #2a3942',
        }}
      >
        <Avatar src={currentChat?.avatar} sx={{ mr: 2, bgcolor: '#00a884' }}>
            {/* Fallback si no hay avatar */}
            {currentChat?.name ? currentChat.name[0].toUpperCase() : '?'}
        </Avatar>
        <Box>
            <Typography variant="body1" sx={{ color: '#e9edef', fontWeight: 'bold' }}>
            {currentChat?.name || 'Chat Activo'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8696a0' }}>
                {currentChat?.isGuestChat ? 'Invitado temporal' : 'En línea'}
            </Typography>
        </Box>
      </Box>

      {/* Lista de Mensajes */}
      <List sx={{ flex: 1, overflowY: 'auto', p: 2, backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', opacity: 0.95 }}>
        {messages.map((m: any, i: number) => {
          const isSelf = m.from === state.user?.id || m.isSelf;
          const isSystem = m.from === 'system';

          return (
            <ListItem
              key={i}
              sx={{
                justifyContent: isSystem ? 'center' : isSelf ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  bgcolor: isSystem ? 'rgba(32, 44, 51, 0.8)' : isSelf ? '#005c4b' : '#202c33',
                  color: isSystem ? '#ffd279' : '#e9edef',
                  px: 2,
                  py: 1,
                  borderRadius: isSystem ? 4 : 2,
                  borderTopRightRadius: isSelf ? 0 : 2,
                  borderTopLeftRadius: !isSelf && !isSystem ? 0 : 2,
                  maxWidth: '70%',
                  fontSize: isSystem ? '0.85rem' : '1rem',
                  boxShadow: 1
                }}
              >
                <Typography variant="body1" component="span" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {m.text}
                </Typography>
                <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 0.5, opacity: 0.6, fontSize: '0.7rem' }}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </ListItem>
          );
        })}
        <div ref={scrollRef} />
      </List>

      {/* Input Area */}
      <Box
        sx={{
          bgcolor: '#202c33',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <TextField
          variant="outlined"
          fullWidth
          size="small"
          placeholder="Escribe un mensaje"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          sx={{
            mr: 1,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#2a3942',
              borderRadius: 2,
              color: '#e9edef',
              '& fieldset': { border: 'none' }
            }
          }}
        />
        <IconButton 
            onClick={handleSend}
            sx={{ 
                color: '#8696a0', // Color gris por defecto
                // Si hay texto, cambia el fondo y el icono a blanco/verde
                ...(input.trim() && {
                    color: '#fff',
                    bgcolor: '#00a884',
                    '&:hover': { bgcolor: '#008f6f' }
                })
            }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}