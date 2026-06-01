'use client';
import { useEffect, useState, useRef } from "react";
import {
  Box, Avatar, IconButton, List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Typography, Divider, Tooltip, CircularProgress, Badge, TextField, InputAdornment,
  Menu, MenuItem 
} from "@mui/material";

import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search'; 
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People'; 
import LockIcon from '@mui/icons-material/Lock'; 

import { useRouter } from "next/navigation";
import { useGlobal } from "@/context/GlobalContext";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { apiFetch } from "@/libs/apiClient";
import { useGhostMode } from "@/hooks/useGhostMode"; 

import UserProfileModal from "../UserProfileModal"; 
import FriendsListModal from "../FriendsListModal"; 
// 🟢 1. Importamos nuestro Modal Criptográfico
import CryptoModal from "../CryptoModal"; 

export default function ChatList() {
  const { state, dispatch } = useGlobal();
  const { user } = useAuth();
  const { lastMessage } = useSocket();
  const router = useRouter();
  
  const { isGhostModeUnlocked, checkSearchInput } = useGhostMode();

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [searchId, setSearchId] = useState(''); 
  const [isSearching, setIsSearching] = useState(false); 

  // Estados para Modales
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false); 

  // 🟢 2. Estados para el Modal de Seguridad
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);
  const [pendingSecretChatId, setPendingSecretChatId] = useState<string | null>(null);

  const [pendingRequests, setPendingRequests] = useState(0); 
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null); 
  const [notificationList, setNotificationList] = useState<any[]>([]); 

  const isMounted = useRef(true);
  const chats = state.chats || [];

  useEffect(() => {
    isMounted.current = true;
    const loadData = async () => {
      if (!user?.id) return;
      try {
        setLoadingInitial(true);
        const resChats = await apiFetch('/chat/user/me');
        const rawList = Array.isArray(resChats) ? resChats : (resChats.data || resChats.body || []);

        const formatted = rawList.map((c: any) => {
            let chatName = c.name;
            let avatarUrl = c.avatar;
            if (!chatName && Array.isArray(c.participants)) {
                const partner = c.participants.find((p: any) => p._id !== user.id);
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
                isSecret: c.isSecret || false, 
                unreadCount: 0 
            };
        });
        formatted.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (isMounted.current) dispatch({ type: 'SET_CHATS', payload: formatted });

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
  }, [user?.id, dispatch]); 

  useEffect(() => {
    if (!lastMessage || !user?.id) return;
    if (lastMessage.type === 'InviteAccepted' && lastMessage.fullChat) dispatch({ type: 'ADD_CHAT', payload: lastMessage.fullChat });
    if (lastMessage.type === 'friend_request') setPendingRequests(prev => prev + 1);
    if (lastMessage.type === 'message') {
        const isSelf = lastMessage.payload.from === user.id;
        dispatch({
            type: 'ADD_MESSAGE',
            payload: { chatId: lastMessage.chatId, msg: { ...lastMessage.payload, isSelf: isSelf } }
        });
    }
  }, [lastMessage, user?.id, dispatch]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchId(text);
    const unlocked = await checkSearchInput(text);
    if (unlocked) setSearchId(''); 
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchId.trim().length > 0) {
        e.preventDefault(); 
        setIsSearching(true);
        try {
            const searchRes = await apiFetch(`/chat/search/${searchId.trim()}`);
            const foundUser = searchRes.body || searchRes;
            if (!foundUser || !foundUser._id) { alert("Usuario no encontrado."); return; }
            if (foundUser._id === user?.id) { alert("No puedes buscarte a ti mismo."); return; }
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

  const handleNotificationClick = async (event: React.MouseEvent<HTMLElement>) => {
      setNotificationAnchor(event.currentTarget); 
      try {
          const res = await apiFetch('/friend/pending-list');
          setNotificationList(res.body || []);
      } catch (error) { console.error("Error cargando", error); }
  };

  const handleNotificationClose = () => setNotificationAnchor(null);
  const handleRequestInteraction = (requestData: any) => {
      setSearchedUser(requestData.requester);
      setShowProfileModal(true);
      handleNotificationClose(); 
  };
  
  // 🟢 3. EL PORTERO: Validamos seguridad antes de dejarlo entrar al chat
  const handleSelect = (id: string) => {
    const chat = chats.find(c => c.id === id);
    
    // Si el chat es secreto, revisamos la bóveda de la RAM
    if (chat?.isSecret) {
      const isKeyLoaded = sessionStorage.getItem('flym_unlocked_key');
      if (!isKeyLoaded) {
        // Bloqueamos acceso y abrimos el proceso de correo OTP
        setPendingSecretChatId(id);
        setCryptoModalOpen(true);
        return;
      }
    }

    // Si es normal o ya está desbloqueado, pasa directo
    dispatch({ type: "SET_ACTIVE_CHAT", payload: id });
    router.push(`/chat/${id}`); 
  };

  // 🟢 4. Qué hacer cuando el modal termina con éxito
  const handleCryptoSuccess = () => {
    if (pendingSecretChatId) {
      dispatch({ type: "SET_ACTIVE_CHAT", payload: pendingSecretChatId });
      router.push(`/chat/${pendingSecretChatId}`);
      setPendingSecretChatId(null);
    }
  };
  
  const handleOpenInvite = () => dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: true });
  const copyMyId = () => { if (user?.friendId) { navigator.clipboard.writeText(user.friendId); alert(`ID copiado: ${user.friendId}`); }};

  const visibleChats = chats.filter(chat => chat.isSecret ? isGhostModeUnlocked : true);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ bgcolor: "#202c33", p: 2, borderBottom: "1px solid #2a3942", display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar src={user?.avatar} alt={user?.name} sx={{ cursor: 'pointer', mr: 1.5 }} />
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#e9edef', lineHeight: 1 }}>{user?.name || 'Yo'}</Typography>
                        <IconButton size="small" sx={{ p: 0.5 }} onClick={handleNotificationClick}>
                            <Badge badgeContent={pendingRequests} color="error" max={99}>
                                <NotificationsIcon sx={{ color: pendingRequests > 0 ? '#00a884' : '#aebac1', fontSize: 20 }} />
                            </Badge>
                        </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mt: 0.5 }} onClick={copyMyId}>
                        <Typography variant="caption" sx={{ color: '#00a884', fontWeight: 'bold', mr: 0.5 }}>ID: {user?.friendId || 'Cargando...'}</Typography>
                        <ContentCopyIcon sx={{ fontSize: 12, color: '#8696a0' }} />
                    </Box>
                </Box>
            </Box>
            <Box>
                <Tooltip title="Mis Contactos"><IconButton onClick={() => setShowFriendsModal(true)}><PeopleIcon sx={{ color: "#aebac1" }} /></IconButton></Tooltip>
                <Tooltip title="Nuevo chat"><IconButton onClick={handleOpenInvite}><ChatIcon sx={{ color: "#aebac1" }} /></IconButton></Tooltip>
                <IconButton><MoreVertIcon sx={{ color: "#aebac1" }} /></IconButton>
            </Box>
        </Box>
        <Box sx={{ bgcolor: '#111b21', borderRadius: 2 }}>
            <TextField fullWidth placeholder="Buscar ID o PIN Secreto..." value={searchId} onChange={handleSearchChange} onKeyDown={handleSearchKeyDown} disabled={isSearching} size="small" InputProps={{ startAdornment: (<InputAdornment position="start">{isSearching ? <CircularProgress size={20} sx={{ color: '#00a884' }} /> : <SearchIcon sx={{ color: '#8696a0', fontSize: 20 }} />}</InputAdornment>) }} sx={{ '& .MuiOutlinedInput-root': { color: '#e9edef', fontSize: '0.9rem', '& fieldset': { border: 'none' }, '& input': { py: 1 } } }} />
        </Box>
      </Box>

      <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
        {loadingInitial && chats.length === 0 && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={30} sx={{ color: '#00a884' }} /></Box>}
        {!loadingInitial && visibleChats.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" sx={{ color: "#8696a0", mb: 1 }}>No tienes chats activos.</Typography>
            <Typography variant="subtitle2" sx={{ color: '#00a884', cursor: 'pointer' }} onClick={handleOpenInvite}>Busca un ID arriba</Typography>
          </Box>
        )}
        {visibleChats.map((chat) => (
          <Box key={chat.id}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleSelect(chat.id)} selected={state.activeChatId === chat.id} sx={{ height: 72, px: 2, opacity: chat.isSecret ? 0.8 : 1, "&.Mui-selected": { bgcolor: "#2a3942" }, "&:hover": { bgcolor: "#202c33" } }}>
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
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body1" sx={{ color: chat.isSecret ? "#00a884" : "#e9edef", display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {chat.isSecret && <LockIcon sx={{ fontSize: 14 }} />} {chat.name}
                      </Typography>
                      {chat.timestamp && <Typography variant="caption" sx={{ color: "#8696a0", fontSize: '0.75rem' }}>{new Date(chat.timestamp).toLocaleDateString()}</Typography>}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: "#8696a0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: 'block', maxWidth: '80%' }}>{chat.lastMessage}</Typography>
                      {(chat.unreadCount || 0) > 0 && <Box sx={{ bgcolor: '#00a884', color: '#111b21', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{chat.unreadCount}</Box>}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            <Divider variant="inset" component="li" sx={{ ml: 10, bgcolor: "#2a3942", opacity: 0.3 }} />
          </Box>
        ))}
      </List>

      <Menu anchorEl={notificationAnchor} open={Boolean(notificationAnchor)} onClose={handleNotificationClose} PaperProps={{ sx: { bgcolor: '#202c33', color: '#e9edef', width: 300, maxHeight: 400, mt: 1 } }}>
        <Typography variant="subtitle2" sx={{ p: 2, borderBottom: '1px solid #2a3942', fontWeight: 'bold' }}>Solicitudes de Amistad</Typography>
        {notificationList.length === 0 ? (
            <MenuItem disabled sx={{ justifyContent: 'center', py: 3 }}><Typography variant="body2" sx={{ color: '#8696a0' }}>No tienes notificaciones</Typography></MenuItem>
        ) : (
            notificationList.map((req) => (
                <MenuItem key={req._id} onClick={() => handleRequestInteraction(req)} sx={{ borderBottom: '1px solid #2a3942', py: 1.5, '&:hover': { bgcolor: '#111b21' } }}>
                    <ListItemAvatar><Avatar src={req.requester?.avatar} /></ListItemAvatar>
                    <Box sx={{ overflow: 'hidden' }}><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{req.requester?.name || 'Usuario'}</Typography><Typography variant="caption" sx={{ color: '#00a884' }}>Te envió una solicitud</Typography></Box>
                </MenuItem>
            ))
        )}
      </Menu>

      {/* 🟢 5. Renderizamos el Modal al final */}
      <CryptoModal 
        open={cryptoModalOpen} 
        step="REQUEST_OTP" 
        onClose={() => setCryptoModalOpen(false)} 
        onSuccess={handleCryptoSuccess} 
      />

      <UserProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} targetUser={searchedUser} />
      <FriendsListModal open={showFriendsModal} onClose={() => setShowFriendsModal(false)} />
    </Box>
  );
}