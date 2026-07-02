'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Avatar, List, ListItem, ListItemText, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { apiFetch } from '@/libs/apiClient';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  partner: { 
    id?: string; 
    name?: string; 
    avatar?: string; 
  } | null;
  roomId: string | null;
}

export function ProfileModal({ open, onClose, partner, roomId }: ProfileModalProps) {
  const [sharedMedia, setSharedMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !roomId) return;

    const fetchSharedFiles = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/chat/${roomId}/media`);
        const data = res.body || res.data || [];
        setSharedMedia(data);
      } catch (err) {
        console.error("❌ Error cargando archivos compartidos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedFiles();
  }, [open, roomId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#111b21', color: '#e9edef', borderRadius: 3, position: 'relative' } }}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: '#8696a0' }}>
        <CloseIcon />
      </IconButton>

      <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
      <Avatar src={partner?.avatar || undefined} sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#00a884', fontSize: '2rem' }}
>
  {partner?.name ? partner.name.charAt(0).toUpperCase() : '?'}
      </Avatar>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>{partner?.name || 'Usuario'}</Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ borderColor: '#222e35', px: 3, pb: 4 }}>
        <Typography variant="subtitle2" sx={{ color: '#00a884', mb: 2, fontWeight: 'bold', letterSpacing: '0.5px' }}>
          Archivos Compartidos ({sharedMedia.length})
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: '#00a884' }} /></Box>
        ) : sharedMedia.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#8696a0', textAlign: 'center', py: 3 }}>No hay archivos en este canal.</Typography>
        ) : (
          <List sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#2a3942', borderRadius: '5px' } }}>
            {sharedMedia.map((item, idx) => (
              <ListItem key={idx} disablePadding sx={{ mb: 1, '&:hover': { bgcolor: '#202c33' }, borderRadius: 1, p: 1 }}>
                <InsertDriveFileIcon sx={{ color: '#8696a0', mr: 2 }} />
                <ListItemText 
                  primary={item.media?.type || 'Archivo Protegido'} 
                  secondary={new Date(item.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  primaryTypographyProps={{ sx: { color: '#fff', fontSize: '0.85rem' } }}
                  secondaryTypographyProps={{ sx: { color: '#8696a0', fontSize: '0.75rem' } }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}