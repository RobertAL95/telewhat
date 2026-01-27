'use client';
import { useState, useEffect } from 'react';
import { 
    Dialog, DialogContent, DialogTitle, List, ListItem, ListItemAvatar, 
    Avatar, ListItemText, IconButton, Typography, Box, CircularProgress 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import { apiFetch } from '@/libs/apiClient';
import { useGlobal } from '@/context/GlobalContext';
import { useRouter } from 'next/navigation';

interface FriendsListModalProps {
    open: boolean;
    onClose: () => void;
}

export default function FriendsListModal({ open, onClose }: FriendsListModalProps) {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { dispatch } = useGlobal();
    const router = useRouter();

    useEffect(() => {
        if (open) {
            loadFriends();
        }
    }, [open]);

    const loadFriends = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/friend'); // Endpoint que ya tenías: listFriends
            setFriends(res.body || []);
        } catch (error) {
            console.error("Error cargando amigos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async (friend: any) => {
        // Crear/Ir al chat con el amigo
        try {
            const chatRes = await apiFetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: friend._id })
            });
            const newChat = chatRes.body || chatRes;
            
            dispatch({ 
                type: 'ADD_CHAT', 
                payload: {
                    id: newChat._id,
                    name: friend.name,
                    avatar: friend.avatar,
                    lastMessage: "Chat iniciado",
                    timestamp: Date.now(),
                    unreadCount: 0
                } 
            });
            dispatch({ type: "SET_ACTIVE_CHAT", payload: newChat._id });
            onClose();
            router.push(`/chat/${newChat._id}`);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#202c33', color: '#e9edef' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Mis Contactos
                <IconButton onClick={onClose} sx={{ color: '#8696a0' }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: '#2a3942', minHeight: 300, p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#00a884' }}/></Box>
                ) : friends.length === 0 ? (
                    <Typography sx={{ p: 4, textAlign: 'center', color: '#8696a0' }}>Aún no tienes amigos agregados.</Typography>
                ) : (
                    <List>
                        {friends.map((friend) => (
                            <ListItem key={friend._id} secondaryAction={
                                <IconButton onClick={() => handleChat(friend)} sx={{ color: '#00a884' }}><ChatIcon /></IconButton>
                            }>
                                <ListItemAvatar>
                                    <Avatar src={friend.avatar} />
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={friend.name}
                                    secondary={`ID: ${friend.friendId}`}
                                    primaryTypographyProps={{ color: '#e9edef' }}
                                    secondaryTypographyProps={{ color: '#8696a0' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
        </Dialog>
    );
}