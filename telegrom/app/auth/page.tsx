'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const handleChange = (_: React.SyntheticEvent, newValue: 'login' | 'register') => {
    setTab(newValue);
  };

  const switchToLogin = () => setTab('login');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default', // Usa el tema
        px: 2,
      }}
    >
      <Paper 
        elevation={4} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 400,
          borderRadius: 3,
          bgcolor: 'background.paper' 
        }}
      >
        <Typography 
          variant="h5" 
          align="center" 
          mb={3} 
          fontWeight="bold" 
          color="primary.main"
        >
          Flym Messenger
        </Typography>

        <Tabs
          value={tab}
          onChange={handleChange}
          variant="fullWidth"
          sx={{ mb: 4 }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Iniciar sesión" value="login" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Registrarse" value="register" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>

        {tab === 'login' ? (
          <LoginForm />
        ) : (
          <RegisterForm onSuccess={switchToLogin} />
        )}
      </Paper>
    </Box>
  );
}