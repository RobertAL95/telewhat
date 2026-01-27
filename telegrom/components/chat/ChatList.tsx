'use client';
import { useEffect, useState, useRef } from "react";
import {
  Box, Avatar, IconButton, List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Typography, Divider, Tooltip, CircularProgress, Badge, TextField, InputAdornment,
  Menu, MenuItem // 👈 Importamos componentes para el menú desplegable
} from "@mui/material";

// Iconos
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search'; 
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People'; // 👈 Icono para Lista de Amigos

import { useRouter } from "next/navigation";
import { useGlobal } from "@/context/GlobalContext";
import { apiFetch } from "@/libs/apiClient";
import { connectWS } from "@/libs/wsClient"; 

// Importamos Modales
import UserProfileModal from "../UserProfileModal"; // Asegúrate que la ruta sea correcta (./ o ../)
import FriendsListModal from "../FriendsListModal"; // 👈 Nuevo Modal de Amigos

export default function ChatList() {
  const { state, dispatch } = useGlobal();
  const router = useRouter();
  
  const [loadingInitial, setLoadingInitial] = useState(false);
  
  // Estados para la búsqueda
  const [searchId, setSearchId] = useState(''); 
  const [isSearching, setIsSearching] = useState(false); 

  // Estados para Modales
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false); // 👈 Estado para abrir lista de amigos

  // Estados para Notificaciones
  const [pendingRequests, setPendingRequests] = useState(0); // El numerito rojo
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null); // Ancla del menú
  const [notificationList, setNotificationList] = useState<any[]>([]); // La lista de usuarios que te agregaron

  const isMounted = useRef(true);
  const chats = state.chats || [];

  // =========================================================
  // 1. Cargas Iniciales (Chats y Contador)
  // =========================================================
  useEffect(() => {
    isMounted.current = true;
    const loadData = async () => {
      if (chats.length > 0 || !state.user?.id) return;
      try {
        setLoadingInitial(true);
        
        // A) Cargar Chats
        const resChats = await apiFetch('/chat/user/me');
        const rawList = Array.isArray(resChats) ? resChats : (resChats.data || resChats.body || []);

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
        if (isMounted.current) dispatch({ type: 'SET_CHATS', payload: formatted });

        // B) Cargar Contador de Notificaciones
        const resCount = await apiFetch('/friend/pending-count');
        setPendingRequests((resCount.body && resCount.body.count) || 0);

      } catch (e) {
        console.error("Error cargando datos:", e);
      } finally {
        if (isMounted.current) setLoadingInitial(false);
      }
    };
    loadData();
    return () => { isMounted.current = false; };
  }, [state.user?.id]); 


  // =========================================================
  // 2. Gestión WebSocket (Lobby + Eventos Real-time)
  // =========================================================
  useEffect(() => {
    if (!state.user?.id) return;

    console.log("👂 ChatList: Conectando al socket global...");

    connectWS(null, (msg) => {
        // A) Invitación de chat
        if (msg.type === 'InviteAccepted' && msg.fullChat) {
             dispatch({ type: 'ADD_CHAT', payload: msg.fullChat });
        }

        // B) Solicitud de Amistad Recibida (Aumentar contador)
        if (msg.type === 'friend_request') {
            console.log("🔔 Nueva solicitud de amistad!");
            setPendingRequests(prev => prev + 1);
            // Si el menú está abierto, podríamos refrescar la lista aquí también
        }

        // C) Solicitud Aceptada (Feedback visual)
        if (msg.type === 'request_accepted') {
            // Esto ocurre cuando TÚ enviaste la solicitud y el otro la aceptó
            alert(`✅ ¡${msg.fromName || 'El usuario'} aceptó tu solicitud de amistad!`);
        }
    });

  }, [state.user?.id, dispatch]);

  // =========================================================
  // 3. Manejo del Menú de Notificaciones
  // =========================================================
  const handleNotificationClick = async (event: React.MouseEvent<HTMLElement>) => {
      setNotificationAnchor(event.currentTarget); // Abre el menú visualmente
      
      // Llamamos al backend para obtener la lista detallada (quién me agregó)
      try {
          const res = await apiFetch('/friend/pending-list');
          setNotificationList(res.body || []);
      } catch (error) {
          console.error("Error cargando lista de notificaciones", error);
      }
  };

  const handleNotificationClose = () => {
      setNotificationAnchor(null);
  };

  const handleRequestInteraction = (requestData: any) => {
      // Al hacer click en una notificación, abrimos el perfil de ESA persona
      // requestData.requester contiene los datos del usuario populados por el backend
      setSearchedUser(requestData.requester);
      setShowProfileModal(true);
      handleNotificationClose(); // Cerramos el menú
  };

  // =========================================================
  // 4. Búsqueda y Navegación
  // =========================================================
  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchId.trim().length > 0) {
        e.preventDefault(); 
        setIsSearching(true);
        try {
            const searchRes = await apiFetch(`/chat/search/${searchId.trim()}`);
            const foundUser = searchRes.body || searchRes;

            if (!foundUser || !foundUser._id) { alert("Usuario no encontrado."); return; }
            if (foundUser._id === state.user?.id) { alert("No puedes buscarte a ti mismo."); return; }

            setSearchedUser(foundUser);
            setShowProfileModal(true);
            setSearchId(''); 
        } catch (error) {
            console.error("Error búsqueda:", error);
            alert("No se encontró ningún usuario con ese ID.");
        } finally {
            setIsSearching(false);
        }
    }
  };

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
        
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* IZQUIERDA: Avatar + Info */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={state.user?.avatar} alt={state.user?.name} sx={{ cursor: 'pointer', mr: 1.5 }} />
                
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#e9edef', lineHeight: 1 }}>
                            {state.user?.name || 'Yo'}
                        </Typography>
                        
                        {/* 🔔 CAMPANA CLICKABLE CON BADGE */}
                        <IconButton size="small" sx={{ p: 0.5 }} onClick={handleNotificationClick}>
                            <Badge badgeContent={pendingRequests} color="error" max={99}>
                                <NotificationsIcon sx={{ color: pendingRequests > 0 ? '#00a884' : '#aebac1', fontSize: 20 }} />
                            </Badge>
                        </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mt: 0.5 }} onClick={copyMyId}>
                        <Typography variant="caption" sx={{ color: '#00a884', fontWeight: 'bold', mr: 0.5 }}>
                            ID: {state.user?.friendId || 'Cargando...'}
                        </Typography>
                        <ContentCopyIcon sx={{ fontSize: 12, color: '#8696a0' }} />
                    </Box>
                </Box>
            </Box>

            {/* DERECHA: Botones */}
            <Box>
                {/* 👥 ICONO LISTA DE AMIGOS */}
                <Tooltip title="Mis Contactos">
                    <IconButton onClick={() => setShowFriendsModal(true)}>
                        <PeopleIcon sx={{ color: "#aebac1" }} />
                    </IconButton>
                </Tooltip>

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

        {/* BARRA DE BÚSQUEDA */}
        <Box sx={{ bgcolor: '#111b21', borderRadius: 2 }}>
            <TextField 
                fullWidth placeholder="Buscar ID amigo..." value={searchId} onChange={(e) => setSearchId(e.target.value)} onKeyDown={handleSearchKeyDown} disabled={isSearching} size="small"
                InputProps={{ startAdornment: (<InputAdornment position="start">{isSearching ? <CircularProgress size={20} sx={{ color: '#00a884' }} /> : <SearchIcon sx={{ color: '#8696a0', fontSize: 20 }} />}</InputAdornment>) }}
                sx={{ '& .MuiOutlinedInput-root': { color: '#e9edef', fontSize: '0.9rem', '& fieldset': { border: 'none' }, '& input': { py: 1 } } }}
            />
        </Box>

      </Box>

      {/* LISTA DE CHATS */}
      <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
        {loadingInitial && chats.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={30} sx={{ color: '#00a884' }} /></Box>
        )}

        {!loadingInitial && chats.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: "#8696a0", mb: 1 }}>No tienes chats activos.</Typography>
            <Typography variant="subtitle2" sx={{ color: '#00a884', cursor: 'pointer' }} onClick={handleOpenInvite}>Busca un ID arriba</Typography>
          </Box>
        )}

        {chats.map((chat) => (
          <Box key={chat.id}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleSelect(chat.id)} selected={state.activeChatId === chat.id} sx={{ height: 72, px: 2, "&.Mui-selected": { bgcolor: "#2a3942" }, "&:hover": { bgcolor: "#202c33" } }}>
                <ListItemAvatar>
                  <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success" invisible={!chat.isGuestChat && (chat.unreadCount || 0) === 0}>
                    <Avatar src={chat.avatar} sx={{ bgcolor: chat.isGuestChat ? '#00a884' : '#53bdeb' }}>
                        {chat.isGuestChat ? <PersonIcon /> : (chat.avatar ? null : <GroupIcon />)}
                        {!chat.avatar && !chat.isGuestChat && chat.name[0]?.toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }} secondaryTypographyProps={{ component: 'div' }}
                  primary={<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body1" sx={{ color: "#e9edef" }}>{chat.name}</Typography>{chat.timestamp && <Typography variant="caption" sx={{ color: "#8696a0", fontSize: '0.75rem' }}>{new Date(chat.timestamp).toLocaleDateString()}</Typography>}</Box>}
                  secondary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ color: "#8696a0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: 'block', maxWidth: '80%' }}>{chat.lastMessage}</Typography>{(chat.unreadCount || 0) > 0 && (<Box sx={{ bgcolor: '#00a884', color: '#111b21', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{chat.unreadCount}</Box>)}</Box>}
                />
              </ListItemButton>
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 10, bgcolor: "#2a3942", opacity: 0.3 }} />
          </Box>
        ))}
      </List>

      {/* 🔽 MENÚ DESPLEGABLE (NOTIFICACIONES) */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{ sx: { bgcolor: '#202c33', color: '#e9edef', width: 300, maxHeight: 400, mt: 1 } }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Typography variant="subtitle2" sx={{ p: 2, borderBottom: '1px solid #2a3942', fontWeight: 'bold' }}>
            Solicitudes de Amistad
        </Typography>

        {notificationList.length === 0 ? (
            <MenuItem disabled sx={{ justifyContent: 'center', py: 3 }}>
                <Typography variant="body2" sx={{ color: '#8696a0' }}>No tienes notificaciones</Typography>
            </MenuItem>
        ) : (
            notificationList.map((req) => (
                <MenuItem 
                    key={req._id} 
                    onClick={() => handleRequestInteraction(req)}
                    sx={{ borderBottom: '1px solid #2a3942', py: 1.5, '&:hover': { bgcolor: '#111b21' } }}
                >
                    <ListItemAvatar>
                        <Avatar src={req.requester?.avatar} />
                    </ListItemAvatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {req.requester?.name || 'Usuario'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00a884' }}>
                            Te envió una solicitud
                        </Typography>
                    </Box>
                </MenuItem>
            ))
        )}
      </Menu>

      {/* MODALES */}
      <UserProfileModal 
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        targetUser={searchedUser}
      />

      <FriendsListModal 
        open={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
      />

    </Box>
  );
}