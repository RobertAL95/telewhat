'use client';

import { Box, Button, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleStart = () => {
    // Redirección estándar a la ruta de autenticación
    router.push('/auth'); 
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        // 'background.default' toma el color definido en tu ThemeProvider (oscuro o claro)
        bgcolor: 'background.default', 
        textAlign: 'center',
        px: 3,
        overflow: 'hidden', // Evita scrollbars innecesarios
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Typography
          variant="h3" // Un poco más grande para impacto visual
          fontWeight="bold"
          gutterBottom
          // 'text.primary' asegura que el texto se vea bien en fondo oscuro o claro
          sx={{ color: 'text.primary', mb: 2 }} 
        >
          Bienvenido a{' '}
          <Typography
            component="span"
            variant="h3"
            fontWeight="bold"
            // 'primary.main' usa el color principal de tu marca (ej. el verde o azul definido)
            sx={{ color: 'primary.main' }} 
          >
            Flym
          </Typography>
        </Typography>

        <Typography 
          variant="body1" 
          sx={{ color: 'text.secondary', mb: 4, maxWidth: 600 }}
        >
          Tu app de mensajería efímera, segura y rápida.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleStart}
          sx={{
            width: '100%',
            maxWidth: 280,
            py: 1.5,
            borderRadius: 3,
            fontSize: '1.1rem',
            textTransform: 'none', // Estilo más moderno sin mayúsculas forzadas
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease-in-out'
            }
          }}
        >
          Comenzar
        </Button>
      </motion.div>
    </Box>
  );
}