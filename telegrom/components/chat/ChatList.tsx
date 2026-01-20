'use client';
import { useEffect, useState, useRef } from "react";
import {
  Box, Avatar, IconButton, List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Typography, Divider, Tooltip, CircularProgress, Badge, TextField, InputAdornment
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search'; 
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; 
import { useRouter } from "next/navigation";

import { useGlobal } from "@/context/GlobalContext";
import { apiFetch } from "@/libs/apiClient";
import { connectWS } from "@/libs/wsClient"; 

export default function ChatList() {
  const { state, dispatch } = useGlobal();
  const router = useRouter();
  
  const [loadingInitial, setLoadingInitial] = useState(false);
  
  // Estados para la búsqueda
  const [searchId, setSearchId] = useState(''); 
  const [isSearching, setIsSearching] = useState(false); // ✨ Nuevo estado para feedback visual

  const isMounted = useRef(true);

  const chats = state.chats || [];

  // =========================================================
  // 1. Carga Inicial HTTP 
  // =========================================================
  useEffect(() => {
    isMounted.current = true;
    const loadChats = async () => {
      if (chats.length > 0 || !state.user?.id) return;
      try {
        setLoadingInitial(true);
        const res = await apiFetch('/chat/user/me');
        const rawList = Array.isArray(res) ? res : (res.data || res.body || []);

        const formatted = rawList.map((c: any) => {
            let chatName = c.name;
            let avatarUrl = c.avatar;
            
            if (!chatName && Array.isArray(c.participants)) {
                const partner = c.participants.find((p: any) => p._id !== state.user?.id);
                if (partner) {
                    chatName = partner.name || partner.email;
                    avatarUrl = partner.avatar;
                }
            }
            return {
                id: c._id || c.id,
                name: chatName || "Usuario Desconocido",
                lastMessage: c.lastMessage?.text || "Sin mensajes",
                timestamp: c.lastMessage?.createdAt || Date.now(),
                avatar: avatarUrl,
                isGuestChat: c.isGuestChat || false,
                unreadCount: 0 
            };
        });

        formatted.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (isMounted.current) {
            dispatch({ type: 'SET_CHATS', payload: formatted });
        }
      } catch (e) {
        console.error("❌ Error cargando chats:", e);
      } finally {
        if (isMounted.current) setLoadingInitial(false);
      }
    };
    loadChats();
    return () => { isMounted.current = false; };
  }, [state.user?.id]); 


  // =========================================================
  // 2. Gestión WebSocket (Lobby)
  // =========================================================
  useEffect(() => {
    if (!state.user?.id) return;

    console.log("👂 ChatList: Conectando al socket global (Lobby)...");

    connectWS(null, (msg) => {
        if (msg.type === 'InviteAccepted' && msg.fullChat) {
             dispatch({ type: 'ADD_CHAT', payload: msg.fullChat });
        }
    });

  }, [state.user?.id, dispatch]);

  // =========================================================
  // 3. 🔍 LÓGICA DE BÚSQUEDA (NUEVO)
  // =========================================================
  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    // Solo actuamos si presiona Enter y hay texto
    if (e.key === 'Enter' && searchId.trim().length > 0) {
        e.preventDefault(); // Evitar saltos de línea si fuera textarea
        setIsSearching(true);
        
        try {
            console.log(`🔎 Buscando usuario con friendId: ${searchId}`);
            
            // A) Buscar Usuario
            // Nota: apiFetch lanza error si el status no es 2xx, así que el catch lo captura
            const searchRes = await apiFetch(`/chat/search/${searchId.trim()}`);
            const foundUser = searchRes.body || searchRes;

            if (!foundUser || !foundUser._id) {
                alert("Usuario no encontrado. Verifica el ID.");
                setIsSearching(false);
                return;
            }

            // Evitar hablar con uno mismo
            if (foundUser._id === state.user?.id) {
                alert("No puedes iniciar un chat contigo mismo.");
                setIsSearching(false);
                return;
            }

            console.log("✅ Usuario encontrado:", foundUser.name);

            // B) Crear o Obtener Chat
            // Enviamos userId en el body, el backend lo mapea a participants
            const chatRes = await apiFetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Importante para que el backend entienda el JSON
                },
                body: JSON.stringify({ userId: foundUser._id }) // 👈 AQUÍ ESTABA EL ERROR
            });
            
            const newChatData = chatRes.body || chatRes;

            // Formatear para el estado local
            // Necesitamos el avatar y nombre del OTRO usuario, no el del grupo genérico
            // Como acabamos de buscar a foundUser, usamos sus datos para la preview
            const chatPreview = {
                id: newChatData._id || newChatData.id,
                name: foundUser.name,     // Usamos el nombre del usuario encontrado
                avatar: foundUser.avatar, // Usamos el avatar del usuario encontrado
                lastMessage: newChatData.lastMessage || "Chat iniciado",
                timestamp: Date.now(),
                unreadCount: 0,
                isGuestChat: foundUser.isGuest || false
            };

            // C) Actualizar Estado Global
            dispatch({ type: 'ADD_CHAT', payload: chatPreview });
            dispatch({ type: "SET_ACTIVE_CHAT", payload: chatPreview.id });
            
            // D) Redirigir y Limpiar
            router.push(`/chat/${chatPreview.id}`);
            setSearchId('');

        } catch (error) {
            console.error("Error en búsqueda:", error);
            alert("No se encontró ningún usuario con ese ID.");
        } finally {
            setIsSearching(false);
        }
    }
  };


  // =========================================================
  // Handlers UI
  // =========================================================
  const handleSelect = (id: string) => {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: id });
    router.push(`/chat/${id}`); 
  };

  const handleOpenInvite = () => {
      dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: true });
  };

  const copyMyId = () => {
      if (state.user?.friendId) {
          navigator.clipboard.writeText(state.user.friendId);
          alert(`ID copiado: ${state.user.friendId}`);
      }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* ================= HEADER SUPERIOR ================= */}
      <Box sx={{ bgcolor: "#202c33", p: 2, borderBottom: "1px solid #2a3942", display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* Fila 1: Avatar + Mi ID + Botones */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={state.user?.avatar} alt={state.user?.name} sx={{ cursor: 'pointer', mr: 1.5 }} />
                
                <Box>
                    <Typography variant="subtitle2" sx={{ color: '#e9edef', lineHeight: 1 }}>
                        {state.user?.name || 'Yo'}
                    </Typography>
                    <Box 
                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mt: 0.5 }}
                        onClick={copyMyId}
                    >
                        <Typography variant="caption" sx={{ color: '#00a884', fontWeight: 'bold', mr: 0.5 }}>
                            ID: {state.user?.friendId || 'Cargando...'}
                        </Typography>
                        <ContentCopyIcon sx={{ fontSize: 12, color: '#8696a0' }} />
                    </Box>
                </Box>
            </Box>

            <Box>
                <Tooltip title="Nuevo chat">
                    <IconButton onClick={handleOpenInvite}>
                    <ChatIcon sx={{ color: "#aebac1" }} />
                    </IconButton>
                </Tooltip>
                <IconButton>
                    <MoreVertIcon sx={{ color: "#aebac1" }} />
                </IconButton>
            </Box>
        </Box>

        {/* Fila 2: Barra de Búsqueda Conectada */}
        <Box sx={{ bgcolor: '#111b21', borderRadius: 2 }}>
            <TextField 
                fullWidth
                placeholder="Buscar ID amigo y presiona Enter..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={handleSearchKeyDown} // 🔥 EVENTO AGREGADO
                disabled={isSearching}          // Bloquear mientras busca
                size="small"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            {/* Mostrar Spinner o Lupa según estado */}
                            {isSearching ? (
                                <CircularProgress size={20} sx={{ color: '#00a884' }} />
                            ) : (
                                <SearchIcon sx={{ color: '#8696a0', fontSize: 20 }} />
                            )}
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        color: '#e9edef',
                        fontSize: '0.9rem',
                        '& fieldset': { border: 'none' },
                        '& input': { py: 1 }
                    }
                }}
            />
        </Box>

      </Box>

      {/* Lista de Chats */}
      <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
        {loadingInitial && chats.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={30} sx={{ color: '#00a884' }} />
          </Box>
        )}

        {!loadingInitial && chats.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: "#8696a0", mb: 1 }}>No tienes chats activos.</Typography>
            <Typography variant="subtitle2" sx={{ color: '#00a884', cursor: 'pointer' }} onClick={handleOpenInvite}>
                Busca un ID arriba o crea una invitación
            </Typography>
          </Box>
        )}

        {chats.map((chat) => (
          <Box key={chat.id}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleSelect(chat.id)}
                selected={state.activeChatId === chat.id}
                sx={{
                  height: 72, px: 2,
                  "&.Mui-selected": { bgcolor: "#2a3942" },
                  "&:hover": { bgcolor: "#202c33" },
                }}
              >
                <ListItemAvatar>
                  <Badge 
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                    invisible={!chat.isGuestChat && (chat.unreadCount || 0) === 0}
                  >
                    <Avatar src={chat.avatar} sx={{ bgcolor: chat.isGuestChat ? '#00a884' : '#53bdeb' }}>
                        {chat.isGuestChat ? <PersonIcon /> : (chat.avatar ? null : <GroupIcon />)}
                        {!chat.avatar && !chat.isGuestChat && chat.name[0]?.toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                
                {/* 🔥 FIX DE HIDRATACIÓN MANTENIDO */}
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}

                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body1" sx={{ color: "#e9edef" }}>{chat.name}</Typography>
                        {chat.timestamp && (
                             <Typography variant="caption" sx={{ color: "#8696a0", fontSize: '0.75rem' }}>
                                {new Date(chat.timestamp).toLocaleDateString()}
                             </Typography>
                        )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: "#8696a0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: 'block', maxWidth: '80%' }}>
                          {chat.lastMessage}
                        </Typography>
                        {(chat.unreadCount || 0) > 0 && (
                            <Box sx={{ bgcolor: '#00a884', color: '#111b21', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {chat.unreadCount}
                            </Box>
                        )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 10, bgcolor: "#2a3942", opacity: 0.3 }} />
          </Box>
        ))}
      </List>
    </Box>
  );
}