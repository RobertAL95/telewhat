'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, IconButton, Typography, Avatar, CircularProgress, Tooltip, InputAdornment, Menu, MenuItem
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MicIcon from '@mui/icons-material/Mic';
import DeleteIcon from '@mui/icons-material/Delete';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LockIcon from '@mui/icons-material/Lock'; 

import { useGlobal } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter } from "next/navigation";
import { useSocket } from '@/context/SocketContext'; 
import { apiFetch } from '@/libs/apiClient'; 

import CryptoModal from "../CryptoModal";
// 🟢 Utilidades de encriptación híbrida
import { encryptMessage, decryptMessage } from '@/utils/crypto';

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
  
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);

  // 🟢 ESTADO PARA LOS MENSAJES DESENCRIPTADOS AL VUELO
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>({});

  // 🟢 Determinamos con precisión atómica si el chat actual en pantalla es una bóveda
  const isCurrentlySecret = currentChat?.isSecret || state.chats.find((c: any) => c._id === activeId)?.isSecret;

  useEffect(() => {
    if (lastMessage?.type === 'typing' && lastMessage.chatId === activeId) {
      if (lastMessage.userId !== user?.id) { 
        setIsPartnerTyping(lastMessage.isTyping);
      }
    }
  }, [lastMessage, activeId, user?.id]);

  useEffect(() => {
    if (!activeId) return;
    const loadChatHistory = async () => {
      try {
        const res = await apiFetch(`/chat/${activeId}/messages`);
        const rawMessages = Array.isArray(res) ? res : (res.body || res.data || []);
        dispatch({ type: 'SET_MESSAGES', payload: { chatId: activeId, messages: rawMessages } });
      } catch (err) { console.error("Error cargando historial:", err); }
    };
    loadChatHistory();
  }, [activeId, dispatch]);

  useEffect(() => {
    if (!activeId) return;
    sendMessage({ type: 'join_chat', chatId: activeId });
    return () => { sendMessage({ type: 'leave_chat', chatId: activeId }); };
  }, [activeId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, decryptedTexts]);

  useEffect(() => {
    return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // 🟢 EL MOTOR DE DESENCRIPTACIÓN AL VUELO (Reactivo a los mensajes entrantes)
  useEffect(() => {
    if (!isCurrentlySecret || messages.length === 0) return;

    const jwkString = sessionStorage.getItem('flym_unlocked_key');
    if (!jwkString) return; 

    const processDecryption = async () => {
      try {
        const jwk = JSON.parse(jwkString);
        const myPrivateKey = await window.crypto.subtle.importKey(
          'jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']
        );

        const newDecrypted = { ...decryptedTexts };
        let hasChanges = false;

        for (const m of messages) {
          if (m.text && !newDecrypted[m._id]) {
            try {
              const parsed = JSON.parse(m.text);
              if (parsed.encryptedTextHex && parsed.encryptedAesKeyHex && parsed.ivHex) {
                const plainText = await decryptMessage(
                  parsed.encryptedTextHex, 
                  parsed.encryptedAesKeyHex, 
                  parsed.ivHex, 
                  myPrivateKey
                );
                newDecrypted[m._id] = plainText;
                hasChanges = true;
              }
            } catch (e) {
              // Si no es un JSON parseable, es un mensaje ordinario heredado en texto plano
              newDecrypted[m._id] = m.text;
              hasChanges = true;
            }
          }
        }

        if (hasChanges) setDecryptedTexts(newDecrypted);
      } catch (err) {
        console.error("Error crítico desencriptando mensajes:", err);
      }
    };

    processDecryption();
  }, [messages, isCurrentlySecret]);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!activeId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendMessage({ type: 'typing', chatId: activeId, isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({ type: 'typing', chatId: activeId, isTyping: false });
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

  // 🟢 EL INTERCEPTOR DE ENVÍO (Cifrado de Extremo a Extremo)
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
    let finalPayloadText = textToSend; 

    try {
        if (fileToSend) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', fileToSend);
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/media/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
            });
            const data = await uploadRes.json();
            if (data.error) throw new Error(data.message);
            mediaData = { url: data.body.url, type: data.body.type, public_id: data.body.public_id };
            setIsUploading(false);
            if (!audioFileParam) clearFile(); 
        }

        // 🟢 B. CIFRAMOS SI EL CHAT SE DETECTA COMO PRIVADO
        if (isCurrentlySecret && textToSend) {
          try {
            console.log("🔒 Modo secreto activo. Solicitando llave pública del compañero...");
            const keyRes = await apiFetch(`/crypto/partner-key/${activeId}`);
            
            if (keyRes && keyRes.publicKey) {
              console.log("🔑 Llave obtenida. Cifrando payload con AES-GCM encapsulado...");
              const encryptedPackage = await encryptMessage(textToSend, keyRes.publicKey);
              
              // Se serializa el objeto JSON completo como texto plano para la base de datos
              finalPayloadText = JSON.stringify(encryptedPackage);
              
              // Guardamos el texto original en la RAM local del emisor para renderizado instantáneo
              setDecryptedTexts(prev => ({ ...prev, [tempId]: textToSend }));
            } else {
              throw new Error("El servidor no proporcionó una llave pública válida.");
            }
          } catch (cryptoErr) {
            console.error("❌ Fallo en cifrado E2EE:", cryptoErr);
            alert("Tu contacto no tiene activado o sincronizado su sistema de llaves secretas todavía.");
            return; 
          }
        }

        const payload = { type: 'message', chatId: activeId, text: finalPayloadText, media: mediaData, tempId: tempId };

        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                chatId: activeId,
                msg: { _id: tempId, from: user?.id, text: finalPayloadText, media: mediaData, timestamp: new Date().toISOString(), isSelf: true }
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

  const renderMediaContent = (media: MediaAttachment) => { return <span/>; };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  const handleMakeSecretClick = () => {
    handleMenuClose();
    setCryptoModalOpen(true);
  };

  const handleSetupSuccess = async () => {
    try {
      await apiFetch(`/chat/${activeId}/make-secret`, { method: 'PUT' });
      alert("¡Bóveda configurada y chat marcado como secreto! 🔒");
      dispatch({ type: 'UPDATE_CHAT', payload: { id: activeId!, isSecret: true } });
    } catch (err) {
      console.error("Error al marcar como secreto:", err);
    }
  };

  if (!user) return <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a' }}><CircularProgress sx={{ color: '#00a884' }} /><Typography sx={{ ml: 2, color: '#8696a0' }}>Cargando identidad...</Typography></Box>;
  if (activeId && !currentChat) return <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a', flexDirection: 'column' }}><CircularProgress sx={{ color: '#00a884' }} /><Typography sx={{ mt: 2, color: '#8696a0' }}>Sincronizando chat...</Typography></Box>;
  if (!activeId) return <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#222e35', borderBottom: '6px solid #00a884' }}><Box sx={{ textAlign: 'center', p: 4 }}><Typography variant="h4" color="#e9edef" fontWeight="light">Flym Web</Typography><Typography variant="body1" color="#8696a0" sx={{ mt: 2 }}>Selecciona un chat para comenzar a enviar mensajes.</Typography></Box></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0b141a', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
      <style dangerouslySetInnerHTML={{__html: `@keyframes customPulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }`}} />

      <Box sx={{ height: 60, bgcolor: "#202c33", display: "flex", alignItems: "center", px: 2, borderBottom: '1px solid #2a3942' }}>
        <IconButton sx={{ color: "#d1d7db", mr: 1, display: { md: 'none' } }} onClick={() => router.push('/chat')}><ArrowBackIcon /></IconButton>
        <Avatar src={currentChat?.avatar} sx={{ mr: 2, bgcolor: '#00a884' }}>{currentChat?.name ? currentChat.name[0].toUpperCase() : '?'}</Avatar>
        <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: isCurrentlySecret ? '#00a884' : '#e9edef', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isCurrentlySecret && <LockIcon sx={{ fontSize: 16 }} />}
                {currentChat?.name || 'Chat Activo'}
            </Typography>
            <Typography variant="caption" sx={{ color: isPartnerTyping ? '#00a884' : '#8696a0', fontWeight: isPartnerTyping ? 'bold' : 'normal' }}>
                {isPartnerTyping ? 'Escribiendo...' : (currentChat?.isGuestChat ? 'Invitado temporal' : 'En línea')}
            </Typography>
        </Box>
        
        <IconButton sx={{ color: "#d1d7db" }} onClick={handleMenuOpen}><MoreVertIcon /></IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose} PaperProps={{ sx: { bgcolor: '#202c33', color: '#e9edef' } }}>
          {!isCurrentlySecret && (
            <MenuItem onClick={handleMakeSecretClick} sx={{ '&:hover': { bgcolor: '#111b21' } }}>
              <LockIcon sx={{ mr: 1, fontSize: 18, color: '#00a884' }} /> Hacer Secreto
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose} sx={{ '&:hover': { bgcolor: '#111b21' } }}>Ver Perfil</MenuItem>
        </Menu>
      </Box>

      {/* Área de Mensajes */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((m: any, i: number) => {
          const messageSender = m.from || m.senderId || m.sender;
          const isSelf = messageSender === user?.id || m.isSelf; 
          const isSystem = m.from === 'system';
          
          // Renderiza el mapa de RAM si ya fue procesado, de lo contrario muestra la cadena cruda
          const displayText = decryptedTexts[m._id] || m.text;
          
          return (
            <Box key={m._id || i} sx={{ display: 'flex', flexDirection: 'column', alignItems: isSystem ? 'center' : isSelf ? 'flex-end' : 'flex-start', mb: 1 }}>
              <Box sx={{ bgcolor: isSystem ? 'rgba(32,44,51,0.8)' : isSelf ? '#005c4b' : '#202c33', color: isSystem ? '#ffd279' : '#e9edef', px: 2, py: 1, borderRadius: isSystem ? 4 : 2, maxWidth: '70%', position: 'relative' }}>
                {m.media && renderMediaContent(m.media)}
                
                {m.text && (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {isCurrentlySecret && m.text.includes('"encryptedTextHex"') && !decryptedTexts[m._id] 
                      ? <span style={{ color: '#8696a0', fontStyle: 'italic' }}>Desencriptando... 🔒</span> 
                      : displayText}
                  </Typography>
                )}
                
                <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 0.5, opacity: 0.6, fontSize: '0.7rem' }}>
                    {new Date(m.timestamp || m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={scrollRef} />
      </Box>

      {selectedFile && (
          <Box sx={{ p: 2, bgcolor: '#182229', borderTop: '1px solid #2a3942', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <IconButton onClick={clearFile} sx={{ position: 'absolute', top: 5, right: 5, color: '#8696a0' }}><CloseIcon /></IconButton>
                {selectedFile.type.startsWith('image/') ? <img src={previewUrl!} alt="p" style={{ maxHeight: 150, borderRadius: 8 }} /> : <InsertDriveFileIcon sx={{ fontSize: 40, color: '#e9edef' }} />}
          </Box>
      )}

      {/* Input de Control */}
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

      <CryptoModal 
        open={cryptoModalOpen} 
        step="SETUP_PIN" 
        onClose={() => setCryptoModalOpen(false)} 
        onSuccess={handleSetupSuccess} 
      />
    </Box>
  );
}