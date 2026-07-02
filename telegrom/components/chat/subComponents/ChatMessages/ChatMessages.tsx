'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { ChatBubble } from '../ChatBubble/ChatBubble';

interface ChatMessagesProps {
  messages: any[];
  currentUserId: string | undefined;
  chatId: string;
}

export function ChatMessages({ messages, currentUserId, chatId }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      {messages.map((m: any, i: number) => (
        <ChatBubble key={m._id || i} message={m} currentUserId={currentUserId} chatId={chatId} />
      ))}
      <div ref={scrollRef} />
    </Box>
  );
}