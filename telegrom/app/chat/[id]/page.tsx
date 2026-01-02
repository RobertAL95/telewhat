'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatWindow from '@/components/Chat/ChatWindow';
import { useGlobal } from '@/context/GlobalContext';
// 👇 Importamos joinRoom que creamos en wsClient.ts
import { getSocket, joinRoom } from '@/libs/wsClient'; 

export default function ActiveChatPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const { dispatch } = useGlobal();

  useEffect(() => {
    if (chatId) {
      // 1. Activar chat en estado global (Visual)
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatId });

      // 2. 🔥 LÓGICA WS: Unirse a la sala
      const socket = getSocket();
      
      // ERROR 1 CORREGIDO: Usamos readyState === 1 (OPEN) en lugar de .connected
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(`🔌 Enviando solicitud para unirse a sala: ${chatId}`);
        
        // ERROR 2 CORREGIDO: Usamos la función helper en lugar de .emit()
        joinRoom(chatId); 
      } else {
        console.warn('⚠️ Socket no conectado al intentar unirse al chat');
      }
    }

    // Cleanup: Salir de la sala al desmontar
    return () => {
      const socket = getSocket();
      // ERROR 3 CORREGIDO: Usamos .send() manual porque no existe .emit()
      if (socket && socket.readyState === WebSocket.OPEN && chatId) {
        socket.send(JSON.stringify({ type: 'leave_chat', chatId }));
      }
    };
  }, [chatId, dispatch]);

  if (!chatId) return null;

  return <ChatWindow />;
}