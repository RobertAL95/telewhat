'use client'
import { Box, Typography, TextField, Button, Divider } from '@mui/material'
import { Google, GitHub } from '@mui/icons-material'

interface Props {
  user: string
  password: string
  setUser: (v: string) => void
  setPassword: (v: string) => void
  onSubmit: () => void
  loginGoogle: () => void
  loginGithub: () => void
}

export function RegistroUI({
  user, password, setUser, setPassword, onSubmit, loginGoogle, loginGithub
}: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      gap={2}
      width="300px"
      mx="auto"
    >
      <Typography variant="h4" fontWeight="bold">Crear Cuenta</Typography>

      <TextField
        label="Usuario"
        value={user}
        onChange={e => setUser(e.target.value)}
        fullWidth
      />
      <TextField
        label="Contraseña"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        fullWidth
      />

      <Button variant="contained" color="primary" fullWidth onClick={onSubmit}>
        Registrarse
      </Button>

      <Divider sx={{ width: '100%', my: 2 }}>o</Divider>

      <Box display="flex" gap={2} width="100%">
        <Button variant="outlined" startIcon={<Google />} fullWidth onClick={loginGoogle}>
          Google
        </Button>
        <Button variant="outlined" startIcon={<GitHub />} fullWidth onClick={loginGithub}>
          GitHub
        </Button>
      </Box>
    </Box>
  )
}
