'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatWindow from '@/components/Chat/ChatWindow';
import { useGlobal } from '@/context/GlobalContext';
import { useChatWS } from '@/hooks/useChatWS'; // 🔥 Importamos el Hook Maestro

export default function ActiveChatPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const { dispatch } = useGlobal();
  
  // 1. Seteamos el chat activo en el contexto global
  useEffect(() => {
    if (chatId) {
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatId });
    }
  }, [chatId, dispatch]);

  // 2. 🔥 INVOCACIÓN MÁGICA
  // Este hook se encarga de:
  // - Conectar al socket (si no está)
  // - Unirse a la sala 'chatId'
  // - Escuchar mensajes
  // - Manejar reconexiones
  useChatWS(); 

  // Si no hay ID, no renderizamos nada (o un 404)
  if (!chatId) return null;

  return <ChatWindow />;
}