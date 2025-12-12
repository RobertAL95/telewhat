'use client';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Bienvenido a <span style={{ color: '#00a884' }}>Flym</span>
      </Typography>
      <Typography sx={{ mb: 3, color: 'text.secondary' }}>
        Una app de mensajería efímera y segura
      </Typography>
      <Button variant="contained" color="primary" onClick={() => router.push('/Auth')}>
        Comenzar
      </Button>
    </Box>
  );
}
