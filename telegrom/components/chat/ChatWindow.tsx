'use client';

import React, { useState, useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useChatController } from './hooks/useChatController';

// Componentes modulares
import { ChatHeader } from './subComponents/ChatHeader/ChatHeader';
import { ChatMessages } from './subComponents/ChatMessages/ChatMessages';
import { FilePreview } from './subComponents/FilePreview/FilePreview';
import { ChatInputArea } from './subComponents/ChatInputArea/ChatInputArea';
import CryptoModal from '../UI/CryptoModal';
import { ProfileModal } from './subComponents/ProfileModal/ProfileModal'; // 🟢 Inyección del componente Fase 3

interface ChatWindowProps {
  roomId?: string; 
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const router = useRouter();
  const c = useChatController(roomId); 
  
  // 🟢 ESTADO ADICIONAL FASE 3: Control visual del modal de perfil
  const [profileOpen, setProfileOpen] = useState(false);

  // 🟢 OPTIMIZACIÓN MEMO: Extraer el partner de forma segura libre de mutaciones fantasmas
  const partnerData = useMemo(() => {
    if (!c.currentChat) return null;
    return {
      id: c.currentChat.id || c.currentChat._id,
      name: c.currentChat.name,
      avatar: c.currentChat.avatar
    };
  }, [c.currentChat]);

  if (!c.user || (c.activeId && !c.currentChat)) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
      </Box>
    );
  }

  if (!c.activeId) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#222e35', borderBottom: '6px solid #00a884' }}>
        <Typography variant="h5" color="#e9edef">Flym Web</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0b141a', 
      backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
      backgroundRepeat: 'repeat', backgroundSize: '400px' 
    }}>
      
      <ChatHeader 
        currentChat={c.currentChat}
        isCurrentlySecret={!!c.isCurrentlySecret}
        isPartnerTyping={c.isPartnerTyping}
        onBack={() => router.push('/chat')}
        onMakeSecret={() => c.setCryptoModalOpen(true)}
        onOpenProfile={() => setProfileOpen(true)} // 🟢 Conexión de la prop faltante Fase 3
      />

      <ChatMessages 
        messages={c.messages}
        currentUserId={c.user?.id}
        chatId={c.activeId}
      />

      <FilePreview 
        selectedFile={c.selectedFile}
        previewUrl={c.previewUrl}
        onClear={c.clearFile}
      />

      <ChatInputArea 
        isRecording={c.isRecording}
        recordingTime={c.recordingTime}
        input={c.input}
        selectedFile={c.selectedFile}
        isUploading={c.isUploading}
        fileInputRef={c.fileInputRef}
        onFileSelect={c.handleFileSelect}
        onInputChange={c.handleInputChange}
        onSend={() => c.handleSend()}
        onStartRecording={c.startRecording}
        onCancelRecording={c.cancelRecording}
        onStopRecording={c.stopRecordingAndSend}
      />

      <CryptoModal 
        open={c.cryptoModalOpen} 
        step="SETUP_PIN" 
        onClose={() => c.setCryptoModalOpen(false)} 
        onSuccess={c.handleSetupSuccess} 
      />

      {/* 🟢 COMPONENTE COMPLEMENTARIO FASE 3: Aislado al fondo del render */}
      <ProfileModal 
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        partner={partnerData}
        roomId={c.activeId}
      />
    </Box>
  );
}