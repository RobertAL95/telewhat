'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useGlobal } from '@/context/GlobalContext';
import { useChatWS } from '@/hooks/useChatWS';
import { apiFetch } from '@/libs/apiClient';
import { decryptMessageBatch } from '@/utils/crypto';
import ChatList from '@/components/Chat/ChatList';
import ChatWindow from '@/components/Chat/ChatWindow';

// =====================================================================
// 🟢 COMPONENTE LOCAL: PANTALLA DE BIENVENIDA (Flym Web)
// =====================================================================
function FlymWelcomeView() {
  const { dispatch } = useGlobal();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#8696a0',
        textAlign: 'center',
        p: 3,
        borderBottom: '6px solid #00a884',
        bgcolor: '#222e35'
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, color: '#e9edef', fontWeight: 300 }}>
        Flym Web
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Envía y recibe mensajes sin mantener tu teléfono conectado.<br/>
        Usa Flym en hasta 4 dispositivos vinculados y 1 teléfono.
      </Typography>
      
      <Button
        variant="contained"
        onClick={() => dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: true })}
        sx={{
          bgcolor: '#00a884',
          borderRadius: 5,
          textTransform: 'none',
          px: 4,
          '&:hover': { bgcolor: '#008f6f' }
        }}
      >
        Crear nueva invitación
      </Button>
    </Box>
  );
}

// =====================================================================
// 🛰️ CONTENEDOR MAESTRO DEL MÓDULO (Single Page Application)
// =====================================================================
export default function ChatPage() {
  const { state, dispatch } = useGlobal();
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // 1. Invocación permanente del socket a nivel raíz para mitigar desconexiones
  useChatWS();

  // 2. Canalización bajo demanda (Lazy Loading con cortocircuito de red)
  useEffect(() => {
    const fetchHistoryOnDemand = async () => {
      const chatId = state.activeChatId;
      if (!chatId) return;

      // Cortocircuito: Si la RAM local ya retiene el historial, evitamos viaje de red
      if (state.messages[chatId] && state.messages[chatId].length > 0) {
        console.log(`🧠 Cache-Hit: Canal ${chatId} recuperado desde estado global.`);
        return;
      }

      try {
        setLoadingHistory(true);
        console.log(`📡 API-Fetch: Descargando historial diferido para: ${chatId}`);
        
        const resMessages = await apiFetch(`/chat/${chatId}/messages`);
        const messagesList = Array.isArray(resMessages) ? resMessages : (resMessages?.body || resMessages?.data || []);
        
        // Ejecución controlada del pipeline criptográfico asimétrico
        const clearMessages = await decryptMessageBatch(messagesList, state.unlockedPrivateKey);

        dispatch({ 
          type: 'SET_MESSAGES', 
          payload: { chatId, messages: clearMessages } 
        });
      } catch (err: any) {
        console.error(`❌ Fallo en la carga bajo demanda del canal ${chatId}:`, err.message);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistoryOnDemand();
  }, [state.activeChatId, state.unlockedPrivateKey, dispatch]);

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100vh', bgcolor: '#111b21', overflow: 'hidden' }}>
      
      {/* 🟢 CORRECCIÓN: Flex estricto para evitar encogimiento o desborde visual */}
      {/* Columna Izquierda: Lista de canales */}
      <Box 
        sx={{ 
          width: { xs: '100%', md: '30%' }, 
          minWidth: '340px', 
          maxWidth: '400px',
          borderRight: '1px solid #2a3942', 
          height: '100%',
          flexShrink: 0
        }}
      >
        <ChatList />
      </Box>

      {/* 🟢 CORRECCIÓN: flexGrow 1 ocupa el resto exacto de la pantalla de forma matemática */}
      {/* Columna Derecha: Contenedor Dinámico */}
      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative', bgcolor: '#222e35' }}>
        {state.activeChatId ? (
          loadingHistory && !state.messages[state.activeChatId] ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress sx={{ color: '#00a884' }} />
            </Box>
          ) : (
            <ChatWindow />
          )
        ) : (
          <FlymWelcomeView />
        )}
      </Box>
    </Box>
  );
}