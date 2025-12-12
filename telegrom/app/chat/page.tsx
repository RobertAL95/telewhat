'use client';
import { Box, Typography, Button } from '@mui/material';
import { useGlobal } from '@/context/GlobalContext'; // ✅ Importar contexto

export default function ChatIndexPage() {
  const { dispatch } = useGlobal();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#8696a0',
        textAlign: 'center',
        p: 3,
        borderBottom: '6px solid #00a884'
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, color: '#e9edef', fontWeight: 300 }}>
        Flym Web
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Envía y recibe mensajes sin mantener tu teléfono conectado.<br/>
        Usa Flym en hasta 4 dispositivos vinculados y 1 teléfono.
      </Typography>
      
      <Button
        variant="contained"
        // ✅ ACCIÓN: Despachamos al contexto global en lugar de usar useState local
        onClick={() => dispatch({ type: 'TOGGLE_INVITE_MODAL', payload: true })}
        sx={{
          bgcolor: '#00a884',
          borderRadius: 5,
          textTransform: 'none',
          px: 4,
          '&:hover': { bgcolor: '#008f6f' }
        }}
      >
        Crear nueva invitación
      </Button>

      {/* ❌ Eliminado: <InviteModal /> ya no va aquí, está en el Layout */}
    </Box>
  );
}