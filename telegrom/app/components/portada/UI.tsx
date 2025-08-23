'use client'
import { Box, Typography, Button } from '@mui/material'

export function PortadaUI({ onRegistro, onChat }: { onRegistro: () => void; onChat: () => void }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      textAlign="center"
      sx={{ background: 'linear-gradient(to right, #2196f3, #21cbf3)', color: 'white' }}
    >
      <Typography variant="h2" fontWeight="bold" gutterBottom>
        Bienvenido a Telegrom
      </Typography>
      <Typography variant="h6" gutterBottom>
        Tu plataforma de mensajería rápida y segura
      </Typography>

      <Box mt={4} display="flex" gap={2}>
        <Button variant="contained" color="secondary" onClick={onRegistro}>
          Registrarse
        </Button>
        <Button variant="outlined" color="inherit" onClick={onChat}>
          Entrar
        </Button>
      </Box>
    </Box>
  )
}
