'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/context/GlobalContext'; // Usa el contexto global
import { logout } from '@/libs/auth'; // Usa el servicio de API
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Box
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

export default function UserMenu() {
  const { state, dispatch } = useGlobal();
  const { user } = state;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  
  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleClose();
    // Navegación a perfil (asumiendo que existe la ruta, si no, puedes comentarlo)
    router.push('/profile'); 
  };

  const handleLogout = async () => {
    handleClose();
    
    // 1. Llamada al backend (Revocar Token/Cookies)
    await logout();

    // 2. Limpieza del Estado Global (Memoria)
    dispatch({ type: 'LOGOUT' });

    // 3. Redirección
    router.push('/auth');
  };

  // Si no hay usuario cargado, no mostramos nada (o un skeleton)
  if (!user) return null;

  return (
    <Box>
      <IconButton onClick={handleOpen} sx={{ p: 0 }}>
        <Avatar 
          sx={{ 
            bgcolor: '#00a884', 
            width: 40, 
            height: 40,
            fontSize: '1rem'
          }}
          alt={user.name}
          src={undefined} // Aquí podrías poner user.avatar si lo tuvieras
        >
          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            bgcolor: '#233138', // Tema oscuro consistente
            color: '#e9edef',
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfile}>
          <PersonIcon sx={{ mr: 2, color: '#aebac1' }} /> 
          Perfil
        </MenuItem>
        
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2, color: '#f15c6d' }} />
          <Typography sx={{ color: '#f15c6d' }}>Cerrar sesión</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}