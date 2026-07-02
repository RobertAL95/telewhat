'use client';

import { Box, Typography, CircularProgress } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useChatBubble } from './useChatBubble';

interface ChatBubbleProps {
  message: any;
  currentUserId: string | undefined;
  chatId: string;
}

export function ChatBubble({ message, currentUserId, chatId }: ChatBubbleProps) {
  const messageSender = message.from || message.senderId || message.sender;
  const isSelf = messageSender === currentUserId || message.isSelf;
  const isSystem = message.from === 'system';

  const { decryptedMediaUrl, isDecryptingMedia } = useChatBubble(message, chatId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isSystem ? 'center' : isSelf ? 'flex-end' : 'flex-start', mb: 1 }}>
      <Box sx={{ bgcolor: isSystem ? 'rgba(32,44,51,0.8)' : isSelf ? '#005c4b' : '#202c33', color: isSystem ? '#ffd279' : '#e9edef', px: 2, py: 1, borderRadius: isSystem ? 4 : 2, maxWidth: '70%', position: 'relative' }}>
        {message.media && (
          <Box sx={{ mb: 1, position: 'relative', minWidth: 200, minHeight: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isDecryptingMedia ? (
              <CircularProgress size={24} sx={{ color: '#00a884' }} />
            ) : decryptedMediaUrl ? (
              message.media.type.startsWith('image/') ? (
                <img src={decryptedMediaUrl} alt="adjunto" style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 6, objectFit: 'cover', display: 'block' }} />
              ) : message.media.type.startsWith('video/') ? (
                <video src={decryptedMediaUrl} controls style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 6 }} />
              ) : message.media.type.startsWith('audio/') ? (
                <audio src={decryptedMediaUrl} controls style={{ maxWidth: '100%' }} />
              ) : null
            ) : (
              <Typography variant="caption" sx={{ color: '#ef4444' }}>⚠️ Fallo al descifrar archivo</Typography>
            )}
          </Box>
        )}
        {message.text && (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.text}
          </Typography>
        )}
        
        {/* Metadatos: Hora e Indicadores de Sockets */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5, opacity: 0.6 }}>
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {new Date(message.timestamp || message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          
          {/* Renderizado de confirmaciones en tiempo real */}
          {!isSystem && isSelf && (
            <Box component="span" sx={{ display: 'inline-flex', alignTracks: 'center' }}>
              {message.status === 'sent' && (
                <CheckIcon sx={{ fontSize: 15, color: '#8696a0' }} />
              )}
              {(message.status === 'delivered' || message.status === 'read') && (
                <DoneAllIcon sx={{ fontSize: 15, color: message.status === 'read' ? '#53bdeb' : '#8696a0' }} />
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}