'use client';

import { Box, Typography, Avatar, Button } from '@mui/material';
import { orchestrator } from '@/Phases/Phases';
import type { UserProfile } from './types';

interface ProfileViewProps {
  user: UserProfile;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const handleLogout = () => {
    orchestrator.clearCookies();
    orchestrator.goToPhase('Auth');
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
        p: 4,
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <Avatar
        src={user.avatar || '/images/default-avatar.png'}
        alt={user.name}
        sx={{ width: 100, height: 100, margin: '0 auto 20px' }}
      />
      <Typography variant="h5" fontWeight="bold" mb={1}>
        {user.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={2}>
        {user.email}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Estado: {user.status || 'Disponible'}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={() => orchestrator.goToPhase('Chat')}
        sx={{ mb: 2 }}
      >
        Volver al chat
      </Button>

      <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>
        Cerrar sesión
      </Button>
    </Box>
  );
}
