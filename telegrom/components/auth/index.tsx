'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { orchestrator } from '@/Phases/Phases';

export default function Auth() {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const handleChange = (_: React.SyntheticEvent, newValue: 'login' | 'register') => {
    setTab(newValue);
  };

  const handleLoginSuccess = (cookies: any) => {
    orchestrator.saveCookies(cookies);
    orchestrator.goToPhase('Chat');
  };

  const handleRegisterSuccess = () => {
    setTab('login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#fff',
        px: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" align="center" mb={3} fontWeight="bold" color="primary">
          Flym - Acceso
        </Typography>

        <Tabs
          value={tab}
          onChange={handleChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Iniciar sesión" value="login" />
          <Tab label="Registrarse" value="register" />
        </Tabs>

        {tab === 'login' ? (
          <LoginForm onSuccess={handleLoginSuccess} />
        ) : (
          <RegisterForm onSuccess={handleRegisterSuccess} />
        )}
      </Paper>
    </Box>
  );
}
