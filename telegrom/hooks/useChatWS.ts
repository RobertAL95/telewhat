'use client';
import { useEffect, useRef } from 'react';
import { useGlobal } from '@/context/GlobalContext';
import { connectWS, disconnectWS, sendMessage } from '@/libs/wsClient';

/**
 * Hook global que conecta automáticamente al WebSocket
 * del chat activo y maneja eventos entrantes.
 * Usa cookies HttpOnly, por lo que no necesita token explícito.
 */
export function useChatWS() {
  const { state, dispatch } = useGlobal();
  const { activeChatId, user } = state;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!activeChatId) return;

    console.log(`⚙️ Conectando al WS del chat ${activeChatId}...`);

    // Conectar WS: no requiere token, ya se valida por cookie "at"
    wsRef.current = connectWS(activeChatId, (msg) => {
      // Mensajes del sistema
      if (msg?.system && msg?.type === 'user_joined') {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            chatId: activeChatId,
            msg: {
              from: 'system',
              text: `💬 ${msg.userName || 'El invitado'} se ha unido al chat.`,
              timestamp: Date.now(),
            },
          },
        });
        return;
      }

      // Mensaje normal
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { chatId: activeChatId, msg },
      });
    });

    // 🔹 Mensaje local al conectar
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        chatId: activeChatId,
        msg: {
          from: 'system',
          text: `🟢 ${user?.isGuest ? 'Te uniste al chat' : 'Esperando al invitado...'}`,
          timestamp: Date.now(),
        },
      },
    });

    // 🔻 Cleanup al desmontar
    return () => {
      console.log('🧹 Cerrando conexión WS...');
      disconnectWS();
      wsRef.current = null;
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          chatId: activeChatId,
          msg: {
            from: 'system',
            text: '🔴 Desconectado del chat.',
            timestamp: Date.now(),
          },
        },
      });
    };
  }, [activeChatId]);
}
