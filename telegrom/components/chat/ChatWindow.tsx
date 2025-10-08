'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Avatar, Button, InputBase } from '@mui/material';
import { useUser } from '../../context/utils/UserContext';
import { useSocket } from './data/socket';

type Message = { sender: string; text: string };

export default function ChatWindow({
  selectedChatId,
  guestName,
}: {
  selectedChatId?: string;
  guestName?: string;
}) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const displayName = guestName || user?.name || 'Invitado';

  const { sendMessage } = useSocket(
    selectedChatId,
    (msg) => setMessages((prev) => [...prev, msg]),
    displayName
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
  }, [selectedChatId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = { sender: displayName, text: newMessage };
    sendMessage(newMessage);
    setMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  if (!selectedChatId) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Selecciona un chat para comenzar
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', bgcolor: 'white', p: 2 }}>
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender === displayName;
          return (
            <Box
              key={idx}
              sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1 }}
            >
              {!isMe && <Avatar sx={{ width: 30, height: 30, mr: 1 }}>{msg.sender[0]}</Avatar>}
              <Box
                sx={{
                  bgcolor: isMe ? '#DCF8C6' : '#F1F0F0',
                  color: 'black',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: '70%',
                  wordBreak: 'break-word',
                }}
              >
                {!isMe && (
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                    {msg.sender}
                  </Typography>
                )}
                <Typography variant="body2">{msg.text}</Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <InputBase
          sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 2, px: 2, py: 1 }}
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button variant="contained" sx={{ bgcolor: '#0084FF', color: 'white' }} onClick={handleSend}>
          Enviar
        </Button>
      </Box>
    </Box>
  );
}
