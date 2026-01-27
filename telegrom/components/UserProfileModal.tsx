'use client';
import { useState, useEffect } from 'react';
import { 
    Dialog, DialogContent, Avatar, Typography, Box, Button, CircularProgress, IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MessageIcon from '@mui/icons-material/Message';
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import { apiFetch } from '@/libs/apiClient';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/context/GlobalContext';

interface UserProfileModalProps {
    open: boolean;
    onClose: () => void;
    targetUser: {
        _id: string;
        name: string;
        avatar?: string;
        friendId?: string;
        email?: string;
    } | null;
}

export default function UserProfileModal({ open, onClose, targetUser }: UserProfileModalProps) {
    const router = useRouter();
    const { dispatch } = useGlobal();
    
    const [status, setStatus] = useState<'none' | 'sent_pending' | 'received_pending' | 'friends'>('none');
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [friendshipId, setFriendshipId] = useState<string | null>(null);

    // 1. Al abrir, verificamos el estado de amistad
    useEffect(() => {
        if (open && targetUser) {
            checkFriendshipStatus();
        }
    }, [open, targetUser]);

    const checkFriendshipStatus = async () => {
        if (!targetUser) return;
        setLoadingStatus(true);
        try {
            const res = await apiFetch(`/friend/status/${targetUser._id}`);
            const data = res.body || res;
            setStatus(data.status);
            if (data.friendshipId) setFriendshipId(data.friendshipId);
        } catch (error) {
            console.error("Error verificando amistad:", error);
        } finally {
            setLoadingStatus(false);
        }
    };

    // 2. Acciones de Botones
    const handleAddFriend = async () => {
        if (!targetUser) return;
        setLoadingAction(true);
        try {
            await apiFetch('/friend/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: targetUser._id })
            });
            await checkFriendshipStatus(); // Recargar estado
        } catch (error) {
            alert("Error enviando solicitud");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleAccept = async () => {
        if (!friendshipId) return;
        setLoadingAction(true);
        try {
            await apiFetch('/friend/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendshipId })
            });
            await checkFriendshipStatus();
        } catch (error) {
            alert("Error aceptando solicitud");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleSendMessage = async () => {
        if (!targetUser) return;
        setLoadingAction(true);
        try {
            // Lógica movida desde ChatList: Crear/Obtener Chat
            const chatRes = await apiFetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUser._id })
            });
            
            const newChat = chatRes.body || chatRes;

            dispatch({ 
                type: 'ADD_CHAT', 
                payload: {
                    id: newChat._id,
                    name: targetUser.name,
                    avatar: targetUser.avatar,
                    lastMessage: "Chat iniciado",
                    timestamp: Date.now(),
                    unreadCount: 0
                } 
            });

            dispatch({ type: "SET_ACTIVE_CHAT", payload: newChat._id });
            onClose(); // Cerrar modal
            router.push(`/chat/${newChat._id}`); // Ir al chat
        } catch (error) {
            console.error("Error iniciando chat:", error);
            alert("No se pudo iniciar el chat");
        } finally {
            setLoadingAction(false);
        }
    };

    if (!targetUser) return null;

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            fullWidth 
            maxWidth="xs"
            PaperProps={{
                sx: { bgcolor: '#202c33', color: '#e9edef', borderRadius: 3 }
            }}
        >
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, position: 'relative' }}>
                <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: '#8696a0' }}>
                    <CloseIcon />
                </IconButton>

                <Avatar 
                    src={targetUser.avatar} 
                    sx={{ width: 100, height: 100, mb: 2, fontSize: 40, bgcolor: '#00a884' }}
                >
                    {targetUser.name[0]?.toUpperCase()}
                </Avatar>
                
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{targetUser.name}</Typography>
                <Typography variant="body2" sx={{ color: '#8696a0', mb: 3 }}>
                    ID: {targetUser.friendId}
                </Typography>

                {loadingStatus ? (
                    <CircularProgress size={24} sx={{ color: '#00a884' }} />
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                        
                        {/* BOTÓN DE MENSAJE (Siempre visible) */}
                        <Button 
                            variant="contained" 
                            startIcon={<MessageIcon />}
                            onClick={handleSendMessage}
                            disabled={loadingAction}
                            sx={{ bgcolor: '#00a884', '&:hover': { bgcolor: '#008f6f' }, py: 1.2 }}
                        >
                            Enviar Mensaje
                        </Button>

                        {/* BOTÓN DE AMISTAD (Dinámico) */}
                        {status === 'none' && (
                            <Button 
                                variant="outlined" 
                                startIcon={<PersonAddIcon />}
                                onClick={handleAddFriend}
                                disabled={loadingAction}
                                sx={{ color: '#e9edef', borderColor: '#8696a0' }}
                            >
                                Agregar a Contactos
                            </Button>
                        )}

                        {status === 'sent_pending' && (
                            <Button variant="outlined" disabled sx={{ color: '#8696a0', borderColor: '#2a3942' }}>
                                Solicitud Enviada
                            </Button>
                        )}

                        {status === 'received_pending' && (
                            <Button 
                                variant="contained" 
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={handleAccept}
                                disabled={loadingAction}
                            >
                                Aceptar Solicitud
                            </Button>
                        )}

                        {status === 'friends' && (
                            <Typography variant="caption" sx={{ color: '#00a884', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <CheckIcon fontSize="small"/> Ya son amigos
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}