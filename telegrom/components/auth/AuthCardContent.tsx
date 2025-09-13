'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import GitHubIcon from '@mui/icons-material/GitHub'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import { motion, AnimatePresence } from 'framer-motion'

const AuthCardContent = () => {
  const [isRegister, setIsRegister] = useState(false)

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isRegister ? (
        <motion.div
          key="register"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ minWidth: 350, p: 2, borderRadius: 4, boxShadow: 6 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Crear cuenta
              </Typography>

              <TextField fullWidth label="Nombre completo" margin="normal" />
              <TextField fullWidth label="Email" margin="normal" />
              <TextField fullWidth label="Contraseña" type="password" margin="normal" />

              <Button fullWidth variant="contained" sx={{ mt: 2 }}>
                Registrarse
              </Button>

              <Typography align="center" sx={{ mt: 2, mb: 1 }}>
                o registrarse con
              </Typography>

              <Box display="flex" justifyContent="center" gap={2}>
                <IconButton color="primary"><GoogleIcon /></IconButton>
                <IconButton color="primary"><LinkedInIcon /></IconButton>
                <IconButton color="primary"><GitHubIcon /></IconButton>
              </Box>

              <Typography align="center" sx={{ mt: 2 }}>
                ¿Ya tienes cuenta?{' '}
                <Button onClick={() => setIsRegister(false)}>Inicia sesión</Button>
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ minWidth: 350, p: 2, borderRadius: 4, boxShadow: 6 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center">
                Iniciar sesión
              </Typography>

              <TextField fullWidth label="Email" margin="normal" />
              <TextField fullWidth label="Contraseña" type="password" margin="normal" />

              <Button fullWidth variant="contained" sx={{ mt: 2 }}>
                Ingresar
              </Button>

              <Typography align="center" sx={{ mt: 2, mb: 1 }}>
                o continuar con
              </Typography>

              <Box display="flex" justifyContent="center" gap={2}>
                <IconButton color="primary"><GoogleIcon /></IconButton>
                <IconButton color="primary"><LinkedInIcon /></IconButton>
                <IconButton color="primary"><GitHubIcon /></IconButton>
              </Box>

              <Typography align="center" sx={{ mt: 2 }}>
                ¿No tienes cuenta?{' '}
                <Button onClick={() => setIsRegister(true)}>Regístrate</Button>
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthCardContent
