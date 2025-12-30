'use client';
import { useEffect, useState, useRef } from "react";
import {
  Box, Avatar, IconButton, List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Typography, Divider, Tooltip, CircularProgress
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";

// ✅ Importaciones Críticas (las que faltaban)
import { useGlobal } from "@/context/GlobalContext";
import { apiFetch } from "@/libs/apiClient";
import { connectWS, disconnectWS } from "@/libs/wsClient";

export default function ChatList() {
  const { state, dispatch } = useGlobal();
  const router = useRouter();
  
  // Estado local solo para carga inicial
  const [loadingInitial, setLoadingInitial] = useState(false);
  const isMounted = useRef(true);
  
  // Ref para guardar el socket del lobby y no reconectarlo en cada render
  const lobbySocketRef = useRef<WebSocket | null>(null);

  // Leemos chats del Estado Global
  const chats = state.chats || [];

  // =========================================================
  // 1. Carga Inicial HTTP (Tu lógica original)
  // =========================================================
  useEffect(() => {
    isMounted.current = true;

    const loadChats = async () => {
      // Si ya tenemos chats o no hay usuario, no hacemos fetch
      if (chats.length > 0 || !state.user?.id) return;

      try {
        setLoadingInitial(true);
        const res = await apiFetch('/chat/user/me');
        const rawList = Array.isArray(res) ? res : (res.data || res.body || []);

        const formatted = rawList.map((c: any) => {
            let chatName = c.name;
            let avatarUrl = c.avatar;

            // Lógica para poner nombre si es chat 1 a 1
            if (!chatName && Array.isArray(c.participants)) {
                const partner = c.participants.find(
                    (p: any) => p._id !== state.user?.id
                );
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
                avatar: avatarUrl
            };
        });

        // Ordenar por más reciente
        formatted.sort((a: any, b: any) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.id]); // Solo recarga si cambia el usuario


  // =========================================================
  // 2. 🔥 NUEVO: Conexión WS para Notificaciones (Lobby)
  // =========================================================
  useEffect(() => {
    // Solo conectamos si hay usuario
    if (!state.user?.id) return;

    console.log("👂 ChatList: Conectando a WS Lobby para escuchar invitaciones...");

    // Conectamos sin ID de sala (null)
    lobbySocketRef.current = connectWS(null, (msg) => {
        // 🎯 AQUI LLEGA LA MAGIA
        if (msg.type === 'NEW_CHAT_CREATED') {
            console.log("🎉 ¡Nuevo chat recibido por WS!", msg.chat);
            
            // Inyectamos el nuevo chat al inicio de la lista
            dispatch({ 
                type: 'ADD_CHAT', 
                payload: msg.chat 
            });
        }
    });

    return () => {
        // Al desmontar, desconectamos el socket del lobby
        if (lobbySocketRef.current) {
            disconnectWS();
            lobbySocketRef.current = null;
        }
    };
  }, [state.user?.id, dispatch]);


  // =========================================================
  // Lógica de UI (Manejadores)
  // =========================================================
  const handleSelect = (id: string) => {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: id });
    router.push(`/chat/${id}`); // Asegúrate que la ruta sea minúscula (/chat)
  };

  const handleOpenInvite = () => {
      dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: true });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* --- Header --- */}
      <Box sx={{ height: 60, bgcolor: "#202c33", display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, borderBottom: "1px solid #2a3942", flexShrink: 0 }}>
        <Avatar src={state.user?.avatar} alt={state.user?.name} sx={{ cursor: 'pointer' }} />
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

      {/* --- Lista de Chats --- */}
      <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
        {loadingInitial && chats.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={30} sx={{ color: '#00a884' }} />
          </Box>
        )}

        {!loadingInitial && chats.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: "#8696a0", mb: 1 }}>No tienes chats activos.</Typography>
            <Typography variant="subtitle2" sx={{ color: '#00a884', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={handleOpenInvite}>
                Iniciar una conversación
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
                  height: 72,
                  px: 2,
                  "&.Mui-selected": { bgcolor: "#2a3942" },
                  "&.Mui-selected:hover": { bgcolor: "#2a3942" },
                  "&:hover": { bgcolor: "#202c33" },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={chat.avatar} sx={{ width: 48, height: 48, mr: 1, bgcolor: '#00a884' }}>
                    {!chat.avatar && chat.name[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body1" sx={{ color: "#e9edef", fontWeight: 400 }}>{chat.name}</Typography>
                        {chat.timestamp && (
                             <Typography variant="caption" sx={{ color: "#8696a0", fontSize: '0.75rem' }}>
                                {new Date(chat.timestamp).toLocaleDateString()}
                             </Typography>
                        )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ color: "#8696a0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: 'block' }}>
                      {chat.lastMessage}
                    </Typography>
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