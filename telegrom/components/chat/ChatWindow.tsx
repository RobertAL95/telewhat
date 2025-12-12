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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useGlobal } from '@/context/GlobalContext';
import { sendMessage } from '@/libs/wsClient'; // Usamos wsClient.ts
import { useChatWS } from '@/hooks/useChatWS';

interface ChatWindowProps {
    roomId?: string; // Opcional, ya que lo tomamos del contexto global generalmente
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const { state, dispatch } = useGlobal();
  const activeId = roomId || state.activeChatId;
  const messages = activeId ? state.messages[activeId] || [] : [];
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hook de WebSocket: Se encarga de la conexión y recepción de mensajes
  useChatWS();

  // Scroll al fondo al recibir mensajes
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!activeId || !input.trim()) return;
    
    // 1. Enviar por WS
    sendMessage(input.trim()); 

    // 2. Optimistic UI: Agregar mensaje localmente
    // (Opcional: puedes esperar al ACK del servidor si prefieres)
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        chatId: activeId,
        msg: {
          from: state.user?.id,
          text: input.trim(),
          timestamp: Date.now(),
          isSelf: true // Flag útil para renderizado
        }
      }
    });

    setInput('');
  };

  if (!activeId) return null; // O mostrar un placeholder

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
        <Avatar sx={{ mr: 2, bgcolor: '#00a884' }}>?</Avatar>
        <Typography variant="body1" sx={{ color: '#e9edef' }}>
           Chat Activo
        </Typography>
      </Box>

      {/* Lista de Mensajes */}
      <List sx={{ flex: 1, overflowY: 'auto', p: 2, backgroundImage: 'url(/images/chat-bg.png)' }}>
        {messages.map((m, i) => {
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
                {m.text}
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
                color: '#00a884',
                bgcolor: input.trim() ? '#2a3942' : 'transparent',
                '&:hover': { bgcolor: '#2a3942' } 
            }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}