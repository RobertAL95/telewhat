'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '../../../context/utils/UserContext';

export type Message = {
  sender: string;
  text: string;
};

type WSEvent =
  | { type: 'join'; payload: { conversationId: string; user: { id?: string; name: string } } }
  | { type: 'leave' }
  | { type: 'message'; payload: { message: string } };

export function useSocket(
  conversationId: string | undefined,
  onMessage: (msg: Message) => void,
  guestName?: string
) {
  const { user, loading: userLoading } = useUser();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Solo conectar cuando haya un conversationId y el usuario o invitado estén listos
    if (!conversationId) return;
    if (userLoading && !guestName) return; // Espera a que user cargue
    if (!user?.id && !guestName) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5001';
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    // Nombre seguro: invitado > usuario > "Invitado"
    const displayName: string = guestName || user?.name || 'Invitado';

    ws.onopen = () => {
      const joinEvent: WSEvent = {
        type: 'join',
        payload: {
          conversationId,
          user: {
            id: user?.id,
            name: displayName,
          },
        },
      };
      ws.send(JSON.stringify(joinEvent));
      console.log('Socket unido a conversación', user?.id || guestName || 'Invitado');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          const msg: Message = {
            sender: data.sender || 'Anónimo',
            text: data.payload,
          };
          onMessage(msg);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => console.log('WS desconectado');

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        const leaveEvent: WSEvent = { type: 'leave' };
        ws.send(JSON.stringify(leaveEvent));
      }
      ws.close();
    };
  }, [conversationId, onMessage, user?.id, user?.name, userLoading, guestName]);

  const sendMessage = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const event: WSEvent = {
      type: 'message',
      payload: { message: text },
    };
    wsRef.current.send(JSON.stringify(event));
  };

  return { sendMessage };
}
