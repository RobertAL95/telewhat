'use client';
import { useEffect, useState, useRef } from "react";
import {
  Box,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Typography,
  Divider,
  Tooltip,
  CircularProgress
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import { useGlobal } from "@/context/GlobalContext";
import { apiFetch } from "@/libs/apiClient";
import { formatDistanceToNow } from "date-fns"; // Opcional: para fechas amigables
import { es } from "date-fns/locale"; // Opcional: español

// Tipado robusto (idealmente mover a @/types)
interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  timestamp?: number;
  avatar?: string;
  unreadCount?: number; // Preparado para futuro
}

export default function ChatList() {
  const { state, dispatch } = useGlobal();
  const router = useRouter();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Referencia para evitar actualizaciones en componente desmontado
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const loadChats = async () => {
      // Si no hay ID de usuario, no intentamos cargar nada (evita llamadas 401)
      if (!state.user?.id) return;
      
      try {
        setLoading(true);
        
        // Hacemos el fetch. apiFetch ya maneja cookies HttpOnly.
        const res = await apiFetch('/chat/user/me');
        
        // Normalización defensiva de datos
        // Aceptamos: res (array directo), res.data (wrapper común), res.body (tu wrapper)
        const rawList = Array.isArray(res) ? res : (res.data || res.body || []);

        const formatted = rawList.map((c: any) => {
            // Lógica de visualización de nombre (Prioridad: Nombre de Grupo > Nombre de Partner)
            let chatName = c.name;
            let avatarUrl = c.avatar;

            // Si es chat privado (sin nombre explícito), buscar al "otro"
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

        // Ordenar por fecha (más reciente primero)
        formatted.sort((a: any, b: any) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });

        if (isMounted.current) {
            setChats(formatted);
        }
      } catch (e) {
        console.error("❌ Error cargando chats:", e);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    loadChats();

    // Cleanup function
    return () => { isMounted.current = false; };
  }, [state.user?.id]); // Solo recargar si cambia el ID del usuario

  const handleSelect = (id: string) => {
    dispatch({ type: "SET_CHAT", payload: id });
    router.push(`/chat/${id}`);
  };

  const handleOpenInvite = () => {
      dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: true });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* --- Header --- */}
      <Box
        sx={{
          height: 60,
          bgcolor: "#202c33",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          borderBottom: "1px solid #2a3942",
          flexShrink: 0 // Evita que el header se aplaste
        }}
      >
        <Avatar 
            src={state.user?.avatar} 
            alt={state.user?.name}
            sx={{ cursor: 'pointer' }}
            // Podrías añadir onClick para ir al perfil propio
        />
        
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
        
        {/* Estado de Carga */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={30} sx={{ color: '#00a884' }} />
          </Box>
        )}

        {/* Estado Vacío */}
        {!loading && chats.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: "#8696a0", mb: 1 }}>
              No tienes chats activos.
            </Typography>
            <Typography 
                variant="subtitle2" 
                sx={{ 
                    color: '#00a884', 
                    cursor: 'pointer', 
                    '&:hover': { textDecoration: 'underline' } 
                }}
                onClick={handleOpenInvite}
            >
                Iniciar una conversación
            </Typography>
          </Box>
        )}

        {/* Renderizado de Chats */}
        {chats.map((chat) => (
          <Box key={chat.id}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleSelect(chat.id)}
                selected={state.activeChatId === chat.id}
                sx={{
                  height: 72, // Altura estándar de WhatsApp
                  px: 2,
                  "&.Mui-selected": { bgcolor: "#2a3942" },
                  "&.Mui-selected:hover": { bgcolor: "#2a3942" },
                  "&:hover": { bgcolor: "#202c33" },
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={chat.avatar} 
                    sx={{ width: 48, height: 48, mr: 1, bgcolor: '#00a884' }}
                  >
                    {!chat.avatar && chat.name[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body1" sx={{ color: "#e9edef", fontWeight: 400 }}>
                        {chat.name}
                        </Typography>
                        {/* Fecha del último mensaje (Opcional) */}
                        {chat.timestamp && (
                             <Typography variant="caption" sx={{ color: "#8696a0", fontSize: '0.75rem' }}>
                                {new Date(chat.timestamp).toLocaleDateString()}
                             </Typography>
                        )}
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#8696a0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: 'block'
                      }}
                    >
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