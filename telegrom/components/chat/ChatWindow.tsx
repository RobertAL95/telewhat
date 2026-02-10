'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Tooltip,
  InputAdornment
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile'; // 📎 Icono Clip
import CloseIcon from '@mui/icons-material/Close'; // ❌ Icono Cerrar Preview
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useGlobal } from '@/context/GlobalContext';
import { sendWSMessage } from '@/libs/wsClient'; 
import { useChatWS } from '@/hooks/useChatWS';
import { useRouter } from "next/navigation";

interface ChatWindowProps {
   roomId?: string; 
}

// Definimos la estructura del objeto Media
interface MediaAttachment {
   url: string;
   type: string; // 'image/webp', 'video/mp4', etc.
   public_id?: string;
}

export default function ChatWindow({ roomId }: ChatWindowProps) {
  const { state, dispatch } = useGlobal();
  const router = useRouter();
  
  // Determinamos el ID activo
  const activeId = roomId || state.activeChatId;
  
  // Buscamos los metadatos del chat (Nombre, Avatar, etc.)
  const currentChat = state.chats.find((c: any) => (c.id === activeId) || (c._id === activeId));

  const messages = activeId ? state.messages[activeId] || [] : [];
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 📸 Estados para Multimedia
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null); // Input oculto

  // Hook de WebSocket (Mantiene la conexión viva y maneja mensajes)
  useChatWS();

  // Scroll al fondo
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // =========================================================
  // 3. Manejo de Archivos (Selección y Preview) 📎
  // =========================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Validar tamaño (ej. 50MB)
          if (file.size > 50 * 1024 * 1024) {
              alert("El archivo es demasiado pesado (Máx 50MB)");
              return;
          }

          setSelectedFile(file);
          // Crear URL temporal para previsualizar sin subir todavía
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const clearFile = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // =========================================================
  // 4. Subida y Envío 🚀
  // =========================================================
  const handleSend = async () => {
    // Validar que haya algo para enviar (texto O archivo)
    if ((!activeId || !input.trim()) && !selectedFile) return;
    if (isUploading) return;

    let mediaData: MediaAttachment | null = null;
    const tempId = Date.now().toString(); // ID temporal para mostrarlo ya

    try {
        // A) Si hay archivo, subimos primero
        if (selectedFile) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Obtenemos el token para la autenticación
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || localStorage.getItem('token');
            
            // Subida al Backend -> Cloudinary
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/media/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await uploadRes.json();
            if (data.error) throw new Error(data.message);

            // Guardamos la info de Cloudinary
            mediaData = {
                url: data.body.url,
                type: data.body.type,
                public_id: data.body.public_id
            };
            setIsUploading(false);
            clearFile(); // Limpiamos el input de archivo
        }

        // B) Preparar el Payload para el Socket
        const payload = {
            type: 'message',
            chatId: activeId, 
            text: input.trim(),
            media: mediaData // 👈 Adjuntamos el objeto media si existe
        };

        // =========================================================
        // ⚡ ACTUALIZACIÓN OPTIMISTA (Esto hace que se vea como WhatsApp)
        // =========================================================
        // Agregamos el mensaje MANUALMENTE al estado local antes de enviarlo
        dispatch({
            type: 'ADD_MESSAGE',
            payload: {
                chatId: activeId,
                msg: {
                    _id: tempId, // ID temporal
                    from: state.user?.id,
                    text: input.trim(),
                    media: mediaData, // 👈 ¡Aquí está la clave! Mostramos la foto localmente
                    timestamp: new Date().toISOString(),
                    isSelf: true // Es mío
                }
            }
        });

        // C) Enviamos el mensaje por Socket (Para que le llegue al otro y se guarde en BD)
        sendWSMessage(payload); 

        // D) Limpiamos input de texto
        setInput('');
        
        // Forzamos scroll
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    } catch (error) {
        console.error("Error enviando:", error);
        setIsUploading(false);
        alert("Error al enviar mensaje o archivo.");
    }
  };

  // =========================================================
  // 5. Renderizado de Contenido Multimedia 🖼️
  // =========================================================
  const renderMediaContent = (media: MediaAttachment) => {
      if (!media || !media.url) return null;

      const { type, url } = media;

      if (type.startsWith('image/')) {
          return (
              <Box 
                component="img" 
                src={url} 
                alt="adjunto" 
                sx={{ 
                    maxWidth: '100%', 
                    maxHeight: 300, 
                    borderRadius: 2, 
                    mt: 1, 
                    cursor: 'pointer',
                    display: 'block' // Asegura que no se colapse
                }}
                onClick={() => window.open(url, '_blank')}
              />
          );
      }
      
      if (type.startsWith('video/')) {
          return (
              <Box 
                component="video" 
                src={url} 
                controls 
                sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2, mt: 1, display: 'block' }}
              />
          );
      }

      if (type.startsWith('audio/')) {
          return (
              <Box 
                component="audio" 
                src={url} 
                controls 
                sx={{ width: 200, mt: 1 }}
              />
          );
      }

      // Fallback para otros archivos
      return (
          <Box 
            component="a" 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none', mt: 1, bgcolor: 'rgba(0,0,0,0.1)', p: 1, borderRadius: 1 }}
          >
              <InsertDriveFileIcon sx={{ mr: 1 }} />
              <Typography variant="caption">Archivo Adjunto</Typography>
          </Box>
      );
  };

  // =====================================================================
  // 🛡️ GUARDIANES DE ESTADO (State Guards)
  // =====================================================================

  // GUARDIA 1: Identidad
  if (!state.user) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
        <Typography sx={{ ml: 2, color: '#8696a0' }}>Cargando identidad...</Typography>
      </Box>
    );
  }

  // GUARDIA 2: Sincronización
  if (activeId && !currentChat) {
     return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#0b141a', flexDirection: 'column' }}>
        <CircularProgress sx={{ color: '#00a884' }} />
        <Typography sx={{ mt: 2, color: '#8696a0' }}>Sincronizando chat...</Typography>
      </Box>
    );
  }

  // GUARDIA 3: Lobby
  if (!activeId) {
    return (
      <Box sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', bgcolor: '#222e35', borderBottom: '6px solid #00a884' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h4" color="#e9edef" fontWeight="light">Flym Web</Typography>
            <Typography variant="body1" color="#8696a0" sx={{ mt: 2 }}>
                Selecciona un chat para comenzar a enviar mensajes.
            </Typography>
        </Box>
      </Box>
    );
  }

  // =====================================================================
  // 🎨 RENDERIZADO PRINCIPAL
  // =====================================================================

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0b141a', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
      
      {/* Header del Chat */}
      <Box
        sx={{
          height: 60,
          bgcolor: "#202c33",
          display: "flex",
          alignItems: "center",
          px: 2,
          borderBottom: '1px solid #2a3942',
          borderLeft: '1px solid #2a3942'
        }}
      >
        <IconButton sx={{ color: "#d1d7db", mr: 1, display: { md: 'none' } }} onClick={() => router.push('/chat')}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar src={currentChat?.avatar} sx={{ mr: 2, bgcolor: '#00a884' }}>
            {currentChat?.name ? currentChat.name[0].toUpperCase() : '?'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: '#e9edef', fontWeight: 'bold' }}>
            {currentChat?.name || 'Chat Activo'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8696a0' }}>
                {currentChat?.isGuestChat ? 'Invitado temporal' : 'En línea'}
            </Typography>
        </Box>
        <IconButton sx={{ color: "#d1d7db" }}><MoreVertIcon /></IconButton>
      </Box>

      {/* Lista de Mensajes */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((m: any, i: number) => {
          const isSelf = m.from === state.user?.id || m.isSelf;
          const isSystem = m.from === 'system';

          return (
            <Box
                key={m._id || i} // Preferimos el ID si existe
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isSystem ? 'center' : isSelf ? 'flex-end' : 'flex-start',
                    mb: 1
                }}
            >
              <Box
                sx={{
                  bgcolor: isSystem ? 'rgba(32, 44, 51, 0.8)' : isSelf ? '#005c4b' : '#202c33',
                  color: isSystem ? '#ffd279' : '#e9edef',
                  px: 2,
                  py: 1,
                  borderRadius: isSystem ? 4 : 2,
                  borderTopRightRadius: isSelf ? 0 : 2,
                  borderTopLeftRadius: !isSelf && !isSystem ? 0 : 2,
                  maxWidth: '70%',
                  fontSize: isSystem ? '0.85rem' : '1rem',
                  boxShadow: 1,
                  position: 'relative',
                  minWidth: 100 // Para que no se aplaste si solo es hora
                }}
              >
                {/* RENDERIZADO MULTIMEDIA 🖼️ */}
                {m.media && renderMediaContent(m.media)}

                {/* TEXTO */}
                {m.text && (
                    <Typography variant="body1" component="span" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}>
                        {m.text}
                    </Typography>
                )}
                
                <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 0.5, opacity: 0.6, fontSize: '0.7rem', color: isSystem ? '#ffd279' : '#8696a0' }}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          );
        })}
        <div ref={scrollRef} />
      </Box>

      {/* PREVIEW AREA (Si hay archivo seleccionado) */}
      {selectedFile && (
          <Box sx={{ p: 2, bgcolor: '#182229', borderTop: '1px solid #2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <IconButton 
                  onClick={clearFile} 
                  sx={{ position: 'absolute', top: 5, right: 5, color: '#8696a0', bgcolor: 'rgba(0,0,0,0.5)' }}
                >
                   <CloseIcon />
                </IconButton>
                
                {selectedFile.type.startsWith('image/') ? (
                    <img src={previewUrl!} alt="preview" style={{ maxHeight: 150, borderRadius: 8 }} />
                ) : selectedFile.type.startsWith('video/') ? (
                    <video src={previewUrl!} controls style={{ maxHeight: 150, borderRadius: 8 }} />
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#e9edef' }}>
                        <InsertDriveFileIcon sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="caption">{selectedFile.name}</Typography>
                    </Box>
                )}
          </Box>
      )}

      {/* Input Area */}
      <Box
        sx={{
          bgcolor: '#202c33',
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* INPUT DE ARCHIVO OCULTO */}
        <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileSelect} 
            accept="image/*,video/*,audio/*"
        />

        {/* BOTÓN CLIP 📎 */}
        <Tooltip title="Adjuntar foto o video">
            <IconButton sx={{ color: "#8696a0", mr: 1 }} onClick={() => fileInputRef.current?.click()}>
              <AttachFileIcon />
            </IconButton>
        </Tooltip>

        <TextField
          variant="outlined"
          fullWidth
          size="small"
          placeholder="Escribe un mensaje"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          sx={{
            mr: 1,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#2a3942',
              borderRadius: 2,
              color: '#e9edef',
              '& fieldset': { border: 'none' }
            }
          }}
          InputProps={{
              endAdornment: isUploading && (
                  <InputAdornment position="end">
                      <CircularProgress size={20} sx={{ color: '#00a884' }} />
                  </InputAdornment>
              )
          }}
        />
        <IconButton 
            onClick={handleSend}
            disabled={isUploading}
            sx={{ 
                color: '#8696a0', 
                ...((input.trim() || selectedFile) && {
                    color: '#fff',
                    bgcolor: '#00a884',
                    '&:hover': { bgcolor: '#008f6f' }
                })
            }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}