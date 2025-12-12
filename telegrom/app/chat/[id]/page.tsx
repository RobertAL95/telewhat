'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatWindow from '@/components/Chat/ChatWindow';
import { useGlobal } from '@/context/GlobalContext';

export default function ActiveChatPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const { dispatch } = useGlobal();

  useEffect(() => {
    if (chatId) {
      // Actualizar el chat activo en el contexto global
      dispatch({ type: 'SET_CHAT', payload: chatId });
    }
    
    return () => {
      // Opcional: limpiar chat activo al salir
      // dispatch({ type: 'SET_CHAT', payload: null });
    };
  }, [chatId, dispatch]);

  if (!chatId) return null;

  return <ChatWindow />;
}