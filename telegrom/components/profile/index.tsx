'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useUser } from '../../context/utils/UserContext';

export default function Profile() {
  const { user, logout, loading, error } = useUser();

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error || !user)
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
        <Alert severity="error">{error || 'No hay usuario logueado'}</Alert>
      </Box>
    );

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10, px: 2 }}>
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Perfil
          </Typography>

          {user.avatar && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: 100, height: 100, borderRadius: '50%' }}
              />
            </Box>
          )}

          <Typography variant="body1">
            <strong>Nombre:</strong> {user.name}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography variant="body1">
            <strong>ID:</strong> {user.id}
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" color="error" onClick={async () => await logout()}>
              Cerrar sesión
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
