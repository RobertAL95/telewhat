'use client'
import { Box, TextField, Button, Link, Divider } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import GitHubIcon from '@mui/icons-material/GitHub'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import { useAuthCard } from '@/context/AuthCardContext'

export default function RegisterForm() {
  const { setState } = useAuthCard()

  return (
    <Box component="form" display="flex" flexDirection="column" gap={2}>
      {/* Campos tradicionales */}
      <TextField label="Usuario" variant="outlined" fullWidth />
      <TextField label="Correo" variant="outlined" fullWidth />
      <TextField label="Contraseña" type="password" variant="outlined" fullWidth />

      <Button variant="contained" color="primary" fullWidth>
        Registrarse
      </Button>

      {/* Separador */}
      <Divider sx={{ my: 2 }}>o regístrate con</Divider>

      {/* Botones sociales */}
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          fullWidth
          onClick={() => console.log('Registrar con Google')}
        >
          Google
        </Button>

        <Button
          variant="outlined"
          startIcon={<LinkedInIcon />}
          fullWidth
          onClick={() => console.log('Registrar con LinkedIn')}
        >
          LinkedIn
        </Button>

        <Button
          variant="outlined"
          startIcon={<GitHubIcon />}
          fullWidth
          onClick={() => console.log('Registrar con GitHub')}
        >
          GitHub
        </Button>
      </Box>

      {/* Enlace para volver al login */}
      <Link component="button" variant="body2" onClick={() => setState('login')} sx={{ mt: 1 }}>
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </Box>
  )
}
