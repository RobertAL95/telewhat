'use client';

import { Box, Typography, Avatar, IconButton, Menu, MenuItem } from '@mui/material';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockIcon from '@mui/icons-material/Lock';
import { useChatHeader } from './useChatHeader';

interface ChatHeaderProps {
  currentChat: any;
  isCurrentlySecret: boolean;
  isPartnerTyping: boolean;
  onBack: () => void;
  onMakeSecret: () => void;
  onOpenProfile: () => void;
}

export function ChatHeader({
  currentChat, isCurrentlySecret, isPartnerTyping, onBack, onMakeSecret
}: ChatHeaderProps) {
  const { menuAnchor, handleMenuOpen, handleMenuClose, handleMakeSecretClick } = useChatHeader(onMakeSecret);

  return (
    <Box sx={{ height: 60, bgcolor: "#202c33", display: "flex", alignItems: "center", px: 2, borderBottom: '1px solid #2a3942' }}>
      <IconButton sx={{ color: "#d1d7db", mr: 1, display: { md: 'none' } }} onClick={onBack}>
        <ArrowBackIcon />
      </IconButton>
      <Avatar src={currentChat?.avatar} sx={{ mr: 2, bgcolor: '#00a884' }}>
        {currentChat?.name ? currentChat.name[0].toUpperCase() : '?'}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" sx={{ color: isCurrentlySecret ? '#00a884' : '#e9edef', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isCurrentlySecret && <LockIcon sx={{ fontSize: 16 }} />}
          {currentChat?.name || 'Chat Activo'}
        </Typography>
        
        {/* Subtexto de presencia reactivo al estado del socket */}
        <Typography variant="caption" sx={{ color: isPartnerTyping ? '#00a884' : '#8696a0', fontWeight: isPartnerTyping ? 'bold' : 'normal' }}>
          {isPartnerTyping ? 'Escribiendo...' : 'En línea'}
        </Typography>
      </Box>
      <IconButton sx={{ color: "#d1d7db" }} onClick={handleMenuOpen}>
        <MoreVertIcon />
      </IconButton>
      <Menu 
        anchorEl={menuAnchor} 
        open={Boolean(menuAnchor)} 
        onClose={handleMenuClose} 
        PaperProps={{ sx: { bgcolor: '#202c33', color: '#e9edef' } }}
      >
        {!isCurrentlySecret && (
          <MenuItem onClick={handleMakeSecretClick} sx={{ '&:hover': { bgcolor: '#111b21' } }}>
            <LockIcon sx={{ mr: 1, fontSize: 18, color: '#00a884' }} /> Hacer Secreto
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>Ver Perfil</MenuItem>
      </Menu>
    </Box>
  );
}