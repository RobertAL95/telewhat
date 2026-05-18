import React, { useState, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

export const MessageInput = ({ chatId }: { chatId: string }) => {
  const [text, setText] = useState('');
  const { sendMessage } = useSocket();
  const { user } = useAuth();
  
  // Referencia para saber si ya avisamos que estamos escribiendo
  const isTypingRef = useRef(false);
  // Referencia para el temporizador
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // 1. Si no habíamos avisado, avisamos al socket
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendMessage({
        type: 'typing',
        chatId: chatId,
        isTyping: true
      });
    }

    // 2. Limpiamos el temporizador anterior si existe
    if (timerRef.current) clearTimeout(timerRef.current);

    // 3. Creamos un nuevo temporizador de 2 segundos
    timerRef.current = setTimeout(() => {
      sendMessage({
        type: 'typing',
        chatId: chatId,
        isTyping: false
      });
      isTypingRef.current = false;
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    
    sendMessage({
      type: 'message',
      chatId: chatId,
      text: text
    });

    // Al enviar, cortamos el estado de typing inmediatamente
    if (timerRef.current) clearTimeout(timerRef.current);
    isTypingRef.current = false;
    sendMessage({ type: 'typing', chatId, isTyping: false });
    
    setText('');
  };

  return (
    <div>
      <input 
        value={text} 
        onChange={handleInputChange} 
        placeholder="Escribe un mensaje..." 
      />
      <button onClick={handleSend}>Enviar</button>
    </div>
  );
};