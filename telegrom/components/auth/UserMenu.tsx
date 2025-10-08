'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
} from '@mui/material';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    handleClose();
    router.push('/profile');
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    router.push('/auth'); // volver al login
  };

  if (!user) return null; // no mostrar si no está logueado

  return (
    <>
      <IconButton onClick={handleOpen}>
        <Avatar>{user.name ? user.name[0] : '?'}</Avatar>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleProfile}>Perfil</MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">Cerrar sesión</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
