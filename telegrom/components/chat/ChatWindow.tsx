'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, IconButton, Typography, Avatar, CircularProgress, Tooltip, InputAdornment
} from '@mui/material';

// Iconos
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MicIcon from '@mui/icons-material/Mic';
import DeleteIcon from '@mui/icons-material/Delete';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { useGlobal } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter } from "next/navigation";
import { useSocket } from '@/context/SocketContext'; 
import { apiFetch } from '@/libs/apiClient'; // 🟢 Conexión con el cliente API

interface ChatWindowProps {
   roomId?: string; 
}

interface MediaAttachment {
   url: string;
   type: string;
   public_id?: string;
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const { state, dispatch } = useGlobal();
  const { user } = useAuth(); 
  const { lastMessage, sendMessage } = useSocket(); 
  const router = useRouter();
  
  const activeId = roomId || state.activeChatId;
  const currentChat = state.chats.find((c: any) => (c.id === activeId) || (c._id === activeId));
  const messages = activeId ? state.messages[activeId] || [] : [];
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // LOGICA DE TYPING
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🟢 1. ESCUCHAR EVENTO TYPING DEL OTRO USUARIO
  useEffect(() => {
    if (lastMessage?.type === 'typing' && lastMessage.chatId === activeId) {
      if (lastMessage.userId !== user?.id) { 
        setIsPartnerTyping(lastMessage.isTyping);
      }
    }
  }, [lastMessage, activeId, user?.id]);

  // 🟢 2. CARGAR HISTORIAL DE MENSAJES DESDE MONGODB AL ENTRAR AL CHAT
  useEffect(() => {
    if (!activeId) return;

    const loadChatHistory = async () => {
      try {
        const res = await apiFetch(`/chat/${activeId}/messages`);
        const rawMessages = Array.isArray(res) ? res : (res.body || res.data || []);
        
        // Sincroniza las burbujas guardadas con la acción oficial de tu GlobalContext
        dispatch({
          type: 'SET_MESSAGES', 
          payload: { chatId: activeId, messages: rawMessages }
        });
      } catch (err) {
        console.error("❌ Error cargando historial de MongoDB:", err);
      }
    };

    loadChatHistory();
  }, [activeId, dispatch]);

  // 🟢 3. UNIRSE / SALIR DE LA SALA EFÍMERA EN EL BACKEND (Para canalizar Typing)
  useEffect(() => {
    if (!activeId) return;

    sendMessage({ type: 'join_chat', chatId: activeId });

    return () => {
      sendMessage({ type: 'leave_chat', chatId: activeId });
    };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // MANEJAR EL INPUT CON DEBOUNCE
  const handleInputChange = (val: string) => {
    setInput(val);
    if (!activeId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendMessage({ 
        type: 'typing',
        chatId: activeId,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({ 
        type: 'typing',
        chatId: activeId,
        isTyping: false
      });
      isTypingRef.current = false;
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => { /* ... tu lógica de audio ... */ };
  const stopRecordingAndSend = () => { /* ... tu lógica de audio ... */ };
  const cancelRecording = () => { /* ... tu lógica de audio ... */ };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 50 * 1024 * 1024) return alert("Máx 50MB");
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (audioFileParam?: File) => {
    const fileToSend = audioFileParam || selectedFile;
    const textToSend = input.trim();

    if (!activeId) return; 
    if (!textToSend && !fileToSend) return;
    if (isUploading) return;

    const tempId = Date.now().toString(); 

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    sendMessage({ type: 'typing', chatId: activeId, isTyping: false }); 

    let mediaData: MediaAttachment | null = null;
    try {
        if (fileToSend) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', fileToSend);

            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');
            
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/media/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await uploadRes.json();
            if (data.error) throw new Error(data.message);

            mediaData = {
                url: data.body.url,
                type: data.body.type,
                public_id: data.body.public_id
            };
            setIsUploading(false);
            if (!audioFileParam) clearFile(); 
        }

        const payload = {
            type: 'message',
            chatId: activeId, 
            text: textToSend,
            media: mediaData 
        };

        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                chatId: activeId,
                msg: {
                    _id: tempId,
                    from: user?.id, 
                    text: textToSend,
                    media: mediaData,
                    timestamp: new Date().toISOString(),
                    isSelf: true
                }
            }
        });

        sendMessage(payload); 
        setInput('');
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    } catch (error) {
        console.error("Error enviando:", error);
        setIsUploading(false);
        alert("Error al enviar.");
    }
  };

  const renderMediaContent = (media: MediaAttachment) => { /* ... tu lógica de renderizado ... */ };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
        <Typography sx={{ ml: 2, color: '#8696a0' }}>Cargando identidad...</Typography>
      </Box>
    );
  }

  if (activeId && !currentChat) {
     return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a', flexDirection: 'column' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
        <Typography sx={{ mt: 2, color: '#8696a0' }}>Sincronizando chat...</Typography>
      </Box>
    );
  }

  if (!activeId) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#222e35', borderBottom: '6px solid #00a884' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h4" color="#e9edef" fontWeight="light">Flym Web</Typography>
            <Typography variant="body1" color="#8696a0" sx={{ mt: 2 }}>Selecciona un chat para comenzar a enviar mensajes.</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0b141a', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
      <style dangerouslySetInnerHTML={{__html: `@keyframes customPulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }`}} />

      {/* Header */}
      <Box sx={{ height: 60, bgcolor: "#202c33", display: "flex", alignItems: "center", px: 2, borderBottom: '1px solid #2a3942' }}>
        <IconButton sx={{ color: "#d1d7db", mr: 1, display: { md: 'none' } }} onClick={() => router.push('/chat')}><ArrowBackIcon /></IconButton>
        <Avatar src={currentChat?.avatar} sx={{ mr: 2, bgcolor: '#00a884' }}>{currentChat?.name ? currentChat.name[0].toUpperCase() : '?'}</Avatar>
        <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: '#e9edef', fontWeight: 'bold' }}>{currentChat?.name || 'Chat Activo'}</Typography>
            <Typography variant="caption" sx={{ color: isPartnerTyping ? '#00a884' : '#8696a0', fontWeight: isPartnerTyping ? 'bold' : 'normal' }}>
                {isPartnerTyping ? 'Escribiendo...' : (currentChat?.isGuestChat ? 'Invitado temporal' : 'En línea')}
            </Typography>
        </Box>
        <IconButton sx={{ color: "#d1d7db" }}><MoreVertIcon /></IconButton>
      </Box>

      {/* Mensajes */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((m: any, i: number) => {
          // 🟢 4. CORRECCIÓN DE UNIFICACIÓN DEFINITIVA: 
          // Evalúa dinámicamente si el emisor viene plano de WS ('from') o estructurado de MongoDB ('senderId'/'sender')
          const messageSender = m.from || m.senderId || m.sender;
          const isSelf = messageSender === user?.id || m.isSelf; 
          const isSystem = m.from === 'system';
          
          return (
            <Box key={m._id || i} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSystem ? 'center' : isSelf ? 'flex-end' : 'flex-start', mb: 1 }}>
              <Box sx={{ bgcolor: isSystem ? 'rgba(32,44,51,0.8)' : isSelf ? '#005c4b' : '#202c33', color: isSystem ? '#ffd279' : '#e9edef', px: 2, py: 1, borderRadius: isSystem ? 4 : 2, maxWidth: '70%', position: 'relative' }}>
                {m.media && renderMediaContent(m.media)}
                {m.text && <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</Typography>}
                
                <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 0.5, opacity: 0.6, fontSize: '0.7rem' }}>
                    {new Date(m.timestamp || m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={scrollRef} />
      </Box>

      {/* Preview File */}
      {selectedFile && (
          <Box sx={{ p: 2, bgcolor: '#182229', borderTop: '1px solid #2a3942', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <IconButton onClick={clearFile} sx={{ position: 'absolute', top: 5, right: 5, color: '#8696a0' }}><CloseIcon /></IconButton>
                {selectedFile.type.startsWith('image/') ? <img src={previewUrl!} alt="p" style={{ maxHeight: 150, borderRadius: 8 }} /> : <InsertDriveFileIcon sx={{ fontSize: 40, color: '#e9edef' }} />}
          </Box>
      )}

      {/* Input Area */}
      <Box sx={{ bgcolor: '#202c33', px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,video/*,audio/*" />
        {!isRecording ? (
            <>
                <Tooltip title="Adjuntar"><IconButton sx={{ color: "#8696a0", mr: 1 }} onClick={() => fileInputRef.current?.click()}><AttachFileIcon /></IconButton></Tooltip>
                <TextField fullWidth size="small" placeholder="Escribe un mensaje" value={input} onChange={(e) => handleInputChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} sx={{ mr: 1, '& .MuiOutlinedInput-root': { bgcolor: '#2a3942', borderRadius: 2, color: '#e9edef', '& fieldset': { border: 'none' } } }} InputProps={{ endAdornment: isUploading && <InputAdornment position="end"><CircularProgress size={20} /></InputAdornment> }} />
                <IconButton onClick={() => (input.trim() || selectedFile) ? handleSend() : startRecording()} disabled={isUploading} sx={{ color: (input.trim() || selectedFile) ? '#fff' : '#8696a0', bgcolor: (input.trim() || selectedFile) ? '#00a884' : 'transparent', '&:hover': { bgcolor: (input.trim() || selectedFile) ? '#008f6f' : 'rgba(255,255,255,0.1)' } }}><SendIcon /></IconButton>
            </>
        ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#2a3942', borderRadius: 2, px: 2, py: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><FiberManualRecordIcon sx={{ color: '#ff2e2e', animation: 'customPulse 1.5s infinite', mr: 1 }} /><Typography sx={{ color: '#e9edef', fontWeight: 'bold' }}>{formatTime(recordingTime)}</Typography></Box>
                <Box><IconButton onClick={cancelRecording} sx={{ color: '#8696a0', mr: 1 }}><DeleteIcon /></IconButton><IconButton onClick={stopRecordingAndSend} sx={{ color: '#fff', bgcolor: '#00a884' }}><SendIcon /></IconButton></Box>
            </Box>
        )}
      </Box>
    </Box>
  );
}