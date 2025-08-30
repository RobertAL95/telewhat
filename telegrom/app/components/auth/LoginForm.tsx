'use client'
import { Box, TextField, Button, Link } from '@mui/material'
import { useAuthCard } from '@/context/AuthCardContext'

export default function LoginForm() {
  const { setState } = useAuthCard()

  return (
    <Box component="form" display="flex" flexDirection="column" gap={2}>
      <TextField label="Usuario" variant="outlined" fullWidth />
      <TextField label="Contraseña" type="password" variant="outlined" fullWidth />
      <Button variant="contained" color="primary" fullWidth>
        Ingresar
      </Button>
      <Link component="button" variant="body2" onClick={() => setState('register')}>
        ¿No tienes cuenta? Regístrate aquí
      </Link>
    </Box>
  )
}
