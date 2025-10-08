'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, List, ListItemButton, ListItemAvatar, Avatar, ListItemText,
  Typography, TextField, IconButton, Menu, MenuItem, Divider, Button, CircularProgress, Alert
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useUser } from '../../context/utils/UserContext';
import axios from 'axios';
import { useSocket } from './data/socket';

type Chat = { id: string; name: string; lastMessage: string };

export default function ChatList({ onSelectChat }: { onSelectChat: (id: string) => void }) {
  const { user, generateInviteLink, loading: userLoading } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleGenerateInvite = async () => {
    if (!user?.id) return;
    setLoadingInvite(true);
    setInviteError(null);
    setInviteLink(null);

    try {
      const link = await generateInviteLink();
      if (link) setInviteLink(link);
      else setInviteError('No se pudo generar el enlace.');
    } catch (err) {
      console.error('❌ Error generando invitación:', err);
      setInviteError('Error al generar el enlace.');
    } finally {
      setLoadingInvite(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const fetchChats = async () => {
      setLoadingChats(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/chatlist/${user.id}`,
          { withCredentials: true }
        );
        const chatsArray = Array.isArray(res.data) ? res.data : Array.isArray(res.data.body) ? res.data.body : [];
        setChats(
          chatsArray.map((c: any) => ({
            id: c._id,
            name: c.participants?.map((p: any) => p.name).join(', ') || 'Chat sin nombre',
            lastMessage: c.messages?.[c.messages.length - 1]?.text || '',
          }))
        );
      } catch (err: any) {
        console.error('❌ Error cargando chats:', err.message);
        setChats([]);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, [user?.id]);

  useSocket(user ? `user_${user.id}` : undefined, (msg) => {
    try {
      const data = JSON.parse(msg.text);
      if (data.type === 'new_chat' && data.payload) {
        const chat = data.payload;
        setChats((prev) => [
          { id: chat._id, name: chat.participants?.map((p: any) => p.name).join(', ') || 'Chat sin nombre', lastMessage: chat.messages?.[chat.messages.length - 1]?.text || '' },
          ...prev,
        ]);
      }
    } catch {}
  });

  const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
        <IconButton onClick={handleMenuOpen} color="inherit">
          {user?.avatar ? <Avatar src={user.avatar} /> : <AccountCircle fontSize="large" />}
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => (window.location.href = '/profile')}>Perfil</MenuItem>
        </Menu>
      </Box>

      <Box sx={{ p: 1 }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Buscar chats"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      <Divider />

      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Invita a alguien a chatear contigo
        </Typography>
        <Button variant="contained" size="small" onClick={handleGenerateInvite} disabled={!user || loadingInvite || userLoading}>
          {loadingInvite ? <CircularProgress size={20} /> : 'Generar enlace'}
        </Button>

        {inviteError && <Alert severity="error" sx={{ mt: 1 }}>{inviteError}</Alert>}

        {inviteLink && !inviteError && (
          <Box mt={1}>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', mb: 1 }}>{inviteLink}</Typography>
            <Button variant="outlined" size="small" onClick={() => navigator.clipboard.writeText(inviteLink)}>Copiar enlace</Button>
          </Box>
        )}
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loadingChats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : filteredChats.length === 0 ? (
          <Typography sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>Ningún chat iniciado aún.</Typography>
        ) : (
          <List>
            {filteredChats.map((chat) => (
              <ListItemButton key={chat.id} onClick={() => onSelectChat(chat.id)}>
                <ListItemAvatar>
                  <Avatar>{chat.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={chat.name} secondary={chat.lastMessage || 'Sin mensajes'} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
