'use client';

import React, { useEffect } from 'react';
import { Box, Typography, Button, Avatar } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const HomeComponent = () => {
  const router = useRouter();
  const { setAuthMode } = useAuth();

  // Función para ir a auth con login mode
  const goToLogin = () => {
    setAuthMode('login');
    router.push('/auth');
  };

  // Función para ir a auth con register mode
  const goToRegister = () => {
    setAuthMode('register');
    router.push('/auth');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f8fa',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: '#0b93d5',
          width: 80,
          height: 80,
          mb: 3,
          fontSize: 36,
        }}
      >
        F
      </Avatar>

      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#0b93d5' }}>
        Bienvenidos a Flym
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary', mb: 4 }}>
        Tu app de mensajería <b>RÁPIDA</b> y <b>EFÍMERA</b>
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={goToRegister}
        >
          Registrarse
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          onClick={goToLogin}
        >
          Entrar
        </Button>
      </Box>
    </Box>
  );
};

export default HomeComponent;
